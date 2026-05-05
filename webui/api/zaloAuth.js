// webui/api/zaloAuth.js — Đăng nhập QR / hủy QR / đăng xuất Zalo (restart tiến trình sau logout)

import { Router } from "express";
import { existsSync, copyFileSync, unlinkSync } from "node:fs";
import { loadConfig } from "../../core/loadConfig.js";
import { getApi, stopZalo } from "../../core/zalo.js";
import {
  startZaloQrLoginBackground,
  getZaloQrState,
  abortZaloQr,
} from "../../core/zaloQrSession.js";

export const zaloAuthRouter = Router();

export function getZaloAuthEnv() {
  const config = loadConfig();
  const skipZalo = String(process.env.ZALO_GUARDIAN_SKIP_ZALO || "") === "1";
  const credPath = config.credentialsPath
    ? String(config.credentialsPath).trim()
    : "";
  const zcaPath = config.zcaPath ? String(config.zcaPath).trim() : "";
  const credentialsFileExists = !!(credPath && existsSync(credPath));
  const zcaModuleExists = !!(zcaPath && existsSync(zcaPath));
  const qrLoginAvailable =
    !skipZalo &&
    !!credPath &&
    !!zcaPath &&
    zcaModuleExists &&
    !getApi();
  return {
    skipZalo,
    credentialsPathConfigured: !!credPath,
    credentialsFileExists,
    zcaPathConfigured: !!zcaPath,
    zcaModuleExists,
    qrLoginAvailable,
  };
}

zaloAuthRouter.get("/env", (_req, res) => {
  res.json({
    ok: true,
    zaloConnected: !!getApi(),
    ...getZaloAuthEnv(),
  });
});

zaloAuthRouter.get("/qr-state", (_req, res) => {
  res.json({
    ok: true,
    zaloConnected: !!getApi(),
    ...getZaloAuthEnv(),
    qr: getZaloQrState(),
  });
});

zaloAuthRouter.post("/qr-start", (_req, res) => {
  const env = getZaloAuthEnv();
  if (env.skipZalo) {
    return res.status(400).json({ ok: false, error: "skip_zalo" });
  }
  if (!env.credentialsPathConfigured || !env.zcaPathConfigured) {
    return res.status(400).json({ ok: false, error: "paths_not_configured" });
  }
  if (!env.zcaModuleExists) {
    return res.status(400).json({ ok: false, error: "zca_module_missing" });
  }
  if (getApi()) {
    return res.status(409).json({ ok: false, error: "already_connected" });
  }
  try {
    startZaloQrLoginBackground(loadConfig());
    return res.status(202).json({ ok: true, started: true });
  } catch (e) {
    const code = String(e?.message || "");
    if (code === "qr_session_busy") {
      return res.status(409).json({ ok: false, error: "busy" });
    }
    return res.status(400).json({ ok: false, error: code || "start_failed" });
  }
});

zaloAuthRouter.post("/qr-abort", (_req, res) => {
  abortZaloQr();
  res.json({ ok: true });
});

zaloAuthRouter.post("/logout", (_req, res) => {
  try {
    stopZalo();
    const config = loadConfig();
    const cred = config.credentialsPath
      ? String(config.credentialsPath).trim()
      : "";
    if (cred && existsSync(cred)) {
      const bak = `${cred}.${Date.now()}.bak`;
      copyFileSync(cred, bak);
      unlinkSync(cred);
    }
    res.json({ ok: true, restart: true });
    setImmediate(() => process.exit(0));
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});
