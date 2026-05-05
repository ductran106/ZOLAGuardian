// webui/api/status.js

import { Router } from "express";
import { getApi } from "../../core/zalo.js";
import { getAllFlags } from "../../core/featureFlags.js";
import { getZaloAuthEnv } from "./zaloAuth.js";

export const statusRouter = Router();

function pickDisplayNameFromUserInfo(info, rawOwnId) {
  if (!info || typeof info !== "object") return null;
  const id = String(rawOwnId || "").replace(/_0$/i, "");
  const buckets = [
    info.profiles,
    info.changed_profiles,
    info.profile,
  ].filter((b) => b && typeof b === "object");

  const tryProfile = (p) => {
    if (!p || typeof p !== "object") return null;
    const n =
      p.zaloName ?? p.displayName ?? p.name ?? p.dName ?? p.dname ?? null;
    return n ? String(n) : null;
  };

  for (const bucket of buckets) {
    const keys = Object.keys(bucket);
    for (const k of keys) {
      const keyId = k.replace(/_0$/, "");
      if (id && !k.startsWith(id) && keyId !== id) continue;
      const n = tryProfile(bucket[k]);
      if (n) return n;
    }
  }

  for (const bucket of buckets) {
    for (const k of Object.keys(bucket)) {
      const p = bucket[k];
      if (!p || typeof p !== "object") continue;
      const uid = String(
        p.userId ?? p.uid ?? p.user_id ?? ""
      ).replace(/_0$/, "");
      const n = tryProfile(p);
      if (n && (uid === id || k.replace(/_0$/, "") === id)) return n;
    }
  }

  return null;
}

statusRouter.get("/", async (_req, res) => {
  const api = getApi();
  const flags = getAllFlags();
  let ownId = null;
  let ownName = null;
  if (api) {
    try {
      ownId = String(api.getOwnId());
      const prof = await api.getUserInfo(ownId);
      ownName = pickDisplayNameFromUserInfo(prof, ownId);
    } catch {
      ownId = api.getOwnId() != null ? String(api.getOwnId()) : null;
    }
  }
  res.json({
    ok: true,
    zaloConnected: !!api,
    ownId,
    ownName,
    flags,
    zaloAuth: getZaloAuthEnv(),
  });
});
