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
  const dbUrlPatterns = [];
  const dbKeywordPatterns = [];

  for (const r of rows) {
    const p = String(r.pattern || "").trim();
    if (!p) continue;
    if (r.list_type === "allow") {
      if (r.kind === "host") dbAllowHosts.push(p);
      else dbAllowSubstring.push(p);
      continue;
    }
    if (r.list_type === "block") {
      if (r.kind === "regex") dbUrlPatterns.push(p);
      else dbKeywordPatterns.push(p);
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

  // Hỗ trợ tương thích ngược: linkPatterns cũ được xem là URL regex.
  const urlPatterns = uniq([
    ...(baseSpam.urlPatterns || []),
    ...(baseSpam.linkPatterns || []),
    ...dbUrlPatterns,
  ]);
  const keywordPatterns = uniq([
    ...(baseSpam.keywordPatterns || []),
    ...dbKeywordPatterns,
  ]);

  cached = {
    ...baseConfig,
    spam: {
      ...baseSpam,
      linkAllowHosts,
      urlPatterns,
      keywordPatterns,
      // Giữ key cũ để tương thích code/monitor cũ.
      linkPatterns: urlPatterns,
      allowTextSubstrings,
    },
  };
  return cached;
}
