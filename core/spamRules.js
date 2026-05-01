// core/spamRules.js
// Gộp spam từ config.json + DB (spam_list); cache ngắn, invalidate qua eventBus

import db from "./db.js";
import eventBus from "./eventBus.js";

let cached = null;
export function invalidateSpamConfigCache() {
  cached = null;
}

eventBus.on("guardian:db:changed", invalidateSpamConfigCache);

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean).map(String))];
}

function escapeSubstringAsRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {typeof import("../config.json")} baseConfig */
export function getEffectiveSpamConfig(baseConfig) {
  if (cached) return cached;

  const baseSpam = baseConfig.spam || {};
  const rows = db
    .prepare(
      "SELECT list_type, pattern, kind FROM spam_list ORDER BY id ASC"
    )
    .all();

  const dbAllowHosts = [];
  const dbAllowSubstring = [];
  const dbBlockPatterns = [];

  for (const r of rows) {
    const p = String(r.pattern || "").trim();
    if (!p) continue;
    if (r.list_type === "allow") {
      if (r.kind === "host") dbAllowHosts.push(p);
      else dbAllowSubstring.push(p);
      continue;
    }
    if (r.list_type === "block") {
      if (r.kind === "regex") dbBlockPatterns.push(p);
      else dbBlockPatterns.push(escapeSubstringAsRegex(p));
    }
  }

  const linkAllowHosts = uniq([
    ...(baseSpam.linkAllowHosts || []),
    ...dbAllowHosts,
  ]);

  const allowTextSubstrings = uniq([
    ...(baseSpam.allowTextSubstrings || []),
    ...dbAllowSubstring,
  ]);

  const linkPatterns = [
    ...(baseSpam.linkPatterns || []),
    ...dbBlockPatterns,
  ];

  cached = {
    ...baseConfig,
    spam: {
      ...baseSpam,
      linkAllowHosts,
      linkPatterns,
      allowTextSubstrings,
    },
  };
  return cached;
}
