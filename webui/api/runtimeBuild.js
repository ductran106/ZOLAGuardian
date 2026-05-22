// webui/api/runtimeBuild.js — /api/runtime/build
// Build identity: build-info.json (deploy-generated) → package.json + .git fallback.
// Phải an toàn, không crash khi thiếu file.

import { Router } from "express";
import { loadRuntimeBuildInfo } from "../../core/runtimeBuildInfo.js";

export const runtimeBuildRouter = Router();

runtimeBuildRouter.get("/", (_req, res) => {
  try {
    const info = loadRuntimeBuildInfo();
    res.json({ ok: true, ...info });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e?.message || e),
      source: "error",
    });
  }
});
