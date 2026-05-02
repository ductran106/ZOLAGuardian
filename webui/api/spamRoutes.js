// webui/api/spamRoutes.js — CRUD spam_list + invalidate cache Guardian

import { Router } from "express";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "../../core/db.js";
import eventBus from "../../core/eventBus.js";
import { invalidateSpamConfigCache } from "../../core/spamRules.js";

export const spamRoutesRouter = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "../../config.json");

function uniq(arr) {
  return [...new Set((arr || []).map((x) => String(x || "").trim()).filter(Boolean))];
}

function readConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

function writeConfig(next) {
  writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

function configToEntries(cfg) {
  const spam = cfg?.spam || {};
  const allow = [
    ...uniq(spam.linkAllowHosts || []).map((pattern) => ({
      listType: "allow",
      kind: "host",
      pattern,
    })),
    ...uniq(spam.allowTextSubstrings || []).map((pattern) => ({
      listType: "allow",
      kind: "substring",
      pattern,
    })),
  ];
  const block = [
    ...uniq([...(spam.urlPatterns || []), ...(spam.linkPatterns || [])]).map(
      (pattern) => ({
        listType: "block",
        kind: "regex",
        pattern,
      })
    ),
    ...uniq(spam.keywordPatterns || []).map((pattern) => ({
      listType: "block",
      kind: "substring",
      pattern,
    })),
  ];
  return { allow, block, all: [...allow, ...block] };
}

function dbRows() {
  return db
    .prepare(
      `SELECT id, list_type AS listType, pattern, kind FROM spam_list
       ORDER BY list_type DESC, id ASC`
    )
    .all();
}

function signaturesOf(list) {
  return new Set(
    (list || []).map((r) => `${String(r.listType)}|${String(r.kind)}|${String(r.pattern)}`)
  );
}

function buildSyncStats(rows, cfgEntries) {
  const dbSet = signaturesOf(rows);
  const cfgSet = signaturesOf(cfgEntries);
  let configOnly = 0;
  let dbOnly = 0;
  for (const key of cfgSet) if (!dbSet.has(key)) configOnly += 1;
  for (const key of dbSet) if (!cfgSet.has(key)) dbOnly += 1;
  return { configOnly, dbOnly };
}

function buildSyncSamples(rows, cfgAll, limit = 25) {
  const dbSet = signaturesOf(rows);
  const cfgSet = signaturesOf(cfgAll);
  const configOnlySamples = [];
  for (const r of cfgAll) {
    const sig = `${String(r.listType)}|${String(r.kind)}|${String(r.pattern)}`;
    if (!dbSet.has(sig)) {
      configOnlySamples.push({
        listType: r.listType,
        kind: r.kind,
        pattern: r.pattern,
      });
      if (configOnlySamples.length >= limit) break;
    }
  }
  const dbOnlySamples = [];
  for (const r of rows) {
    const sig = `${String(r.listType)}|${String(r.kind)}|${String(r.pattern)}`;
    if (!cfgSet.has(sig)) {
      dbOnlySamples.push({
        listType: r.listType,
        kind: r.kind,
        pattern: r.pattern,
      });
      if (dbOnlySamples.length >= limit) break;
    }
  }
  return { configOnlySamples, dbOnlySamples };
}

function assertValidRegex(pattern) {
  try {
    new RegExp(pattern, "i");
    return null;
  } catch (e) {
    return String(e?.message || e);
  }
}

spamRoutesRouter.get("/", (_req, res) => {
  const rows = dbRows();
  const cfgEntries = configToEntries(readConfig());
  const sync = buildSyncStats(rows, cfgEntries.all);
  const samples = buildSyncSamples(rows, cfgEntries.all);
  res.json({
    ok: true,
    allow: rows.filter((r) => r.listType === "allow"),
    block: rows.filter((r) => r.listType === "block"),
    sync: { ...sync, ...samples },
  });
});

spamRoutesRouter.post("/", (req, res) => {
  const { listType, pattern, kind } = req.body || {};
  const lt =
    listType === "allow" || listType === "block" ? listType : null;
  const p = String(pattern || "").trim();
  if (!lt || !p) {
    return res
      .status(400)
      .json({ ok: false, error: "listType (allow|block) và pattern bắt buộc" });
  }

  let k = kind || "substring";
  if (lt === "allow" && k !== "host" && k !== "substring") {
    return res
      .status(400)
      .json({ ok: false, error: "allow: kind phải host hoặc substring" });
  }
  if (lt === "block" && k !== "substring" && k !== "regex") {
    return res
      .status(400)
      .json({ ok: false, error: "block: kind phải substring hoặc regex" });
  }

  if (p.length > 800) {
    return res
      .status(400)
      .json({ ok: false, error: "pattern tối đa 800 ký tự" });
  }

  if (lt === "block" && k === "regex") {
    const err = assertValidRegex(p);
    if (err) {
      return res
        .status(400)
        .json({ ok: false, error: `Regex không hợp lệ: ${err}` });
    }
  }

  try {
    db.prepare(
      `INSERT INTO spam_list (list_type, pattern, kind) VALUES (?,?,?)`
    ).run(lt, p, k);
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return res
        .status(409)
        .json({ ok: false, error: "Mục này đã tồn tại trong danh sách" });
    }
    throw e;
  }

  invalidateSpamConfigCache();
  eventBus.emit("guardian:db:changed");

  res.json({ ok: true });
});

spamRoutesRouter.post("/sync", (req, res) => {
  const mode = String(req.body?.mode || "config_to_db");
  if (mode !== "config_to_db" && mode !== "db_to_config") {
    return res
      .status(400)
      .json({ ok: false, error: "mode phải là config_to_db hoặc db_to_config" });
  }

  if (mode === "config_to_db") {
    const cfgEntries = configToEntries(readConfig());
    const ins = db.prepare(
      `INSERT OR IGNORE INTO spam_list (list_type, pattern, kind) VALUES (?,?,?)`
    );
    let inserted = 0;
    for (const row of cfgEntries.all) {
      const info = ins.run(row.listType, row.pattern, row.kind);
      inserted += Number(info?.changes || 0);
    }
    invalidateSpamConfigCache();
    eventBus.emit("guardian:db:changed");
    return res.json({ ok: true, mode, inserted });
  }

  const rows = dbRows();
  const nextCfg = readConfig();
  const allowHost = rows
    .filter((r) => r.listType === "allow" && r.kind === "host")
    .map((r) => r.pattern);
  const allowSubstring = rows
    .filter((r) => r.listType === "allow" && r.kind === "substring")
    .map((r) => r.pattern);
  const blockRegex = rows
    .filter((r) => r.listType === "block" && r.kind === "regex")
    .map((r) => r.pattern);
  const blockKeyword = rows
    .filter((r) => r.listType === "block" && r.kind === "substring")
    .map((r) => r.pattern);

  nextCfg.spam = {
    ...(nextCfg.spam || {}),
    linkAllowHosts: uniq(allowHost),
    allowTextSubstrings: uniq(allowSubstring),
    urlPatterns: uniq(blockRegex),
    keywordPatterns: uniq(blockKeyword),
    // Giữ key cũ cho tương thích ngược.
    linkPatterns: uniq(blockRegex),
  };
  writeConfig(nextCfg);
  invalidateSpamConfigCache();
  eventBus.emit("guardian:db:changed");
  return res.json({
    ok: true,
    mode,
    written: {
      linkAllowHosts: nextCfg.spam.linkAllowHosts.length,
      allowTextSubstrings: nextCfg.spam.allowTextSubstrings.length,
      urlPatterns: nextCfg.spam.urlPatterns.length,
      keywordPatterns: nextCfg.spam.keywordPatterns.length,
    },
  });
});

spamRoutesRouter.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "id không hợp lệ" });
  }
  const row = db
    .prepare(
      `SELECT id, list_type AS listType, pattern, kind FROM spam_list WHERE id = ?`
    )
    .get(id);
  if (!row) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy" });
  }

  const p = String(req.body?.pattern ?? row.pattern).trim();
  let k = String(req.body?.kind ?? row.kind).trim();

  const lt = row.listType;
  if (lt === "allow") {
    if (k !== "host" && k !== "substring") {
      return res
        .status(400)
        .json({ ok: false, error: "allow: kind phải host hoặc substring" });
    }
  } else if (k !== "substring" && k !== "regex") {
    return res
      .status(400)
      .json({ ok: false, error: "block: kind phải substring hoặc regex" });
  }

  if (!p) {
    return res.status(400).json({ ok: false, error: "pattern không được để trống" });
  }
  if (p.length > 800) {
    return res
      .status(400)
      .json({ ok: false, error: "pattern tối đa 800 ký tự" });
  }

  if (lt === "block" && k === "regex") {
    const err = assertValidRegex(p);
    if (err) {
      return res
        .status(400)
        .json({ ok: false, error: `Regex không hợp lệ: ${err}` });
    }
  }

  try {
    db.prepare(`UPDATE spam_list SET pattern = ?, kind = ? WHERE id = ?`).run(
      p,
      k,
      id
    );
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return res
        .status(409)
        .json({ ok: false, error: "Trùng pattern với mục khác trong cùng danh sách" });
    }
    throw e;
  }

  invalidateSpamConfigCache();
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true });
});

spamRoutesRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "id không hợp lệ" });
  }
  const info = db.prepare("DELETE FROM spam_list WHERE id = ?").run(id);
  if (info.changes === 0) {
    return res.status(404).json({ ok: false, error: "Không tìm thấy" });
  }
  invalidateSpamConfigCache();
  eventBus.emit("guardian:db:changed");
  res.json({ ok: true });
});
