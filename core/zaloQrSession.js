// core/zaloQrSession.js
// Một phiên đăng nhập QR (zca-js loginQR) — chạy nền, phục vụ Web UI; không gắn vào getApi().

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Khớp zca-js LoginQRCallbackEventType (dist/apis/loginQR.js) */
const QR = {
  GENERATED: 0,
  EXPIRED: 1,
  SCANNED: 2,
  DECLINED: 3,
  GOT_INFO: 4,
};

let busy = false;
let abortFn = null;

const state = {
  phase: "idle",
  /** data URL ảnh QR */
  imageDataUrl: null,
  scannedName: null,
  error: null,
  credentialsWritten: false,
};

export function getZaloQrState() {
  return {
    phase: state.phase,
    imageDataUrl: state.imageDataUrl,
    scannedName: state.scannedName,
    error: state.error,
    credentialsWritten: state.credentialsWritten,
    busy,
  };
}

export function abortZaloQr() {
  if (typeof abortFn === "function") {
    try {
      abortFn();
    } catch {
      /* ignore */
    }
  }
  abortFn = null;
}

function resetState() {
  state.phase = "idle";
  state.imageDataUrl = null;
  state.scannedName = null;
  state.error = null;
  state.credentialsWritten = false;
}

/**
 * Bắt đầu login QR ở background (không chặn HTTP).
 * @param {{ zcaPath: string, credentialsPath: string }} config
 */
export function startZaloQrLoginBackground(config) {
  if (busy) {
    throw new Error("qr_session_busy");
  }
  const zcaPath = String(config.zcaPath || "").trim();
  const credPath = String(config.credentialsPath || "").trim();
  if (!zcaPath || !credPath) {
    throw new Error("paths_required");
  }

  busy = true;
  resetState();
  state.phase = "starting";

  void (async () => {
    try {
      const zcaHref = pathToFileURL(path.resolve(zcaPath)).href;
      const { Zalo } = await import(zcaHref);

      const zalo = new Zalo({ logging: false, selfListen: true });

      await zalo.loginQR(
        {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
          language: "vi",
        },
        (ev) => {
          const t = ev.type;
          if (t === QR.GENERATED) {
            state.phase = "await_scan";
            const b64 = String(ev.data?.image || "");
            state.imageDataUrl = b64
              ? `data:image/png;base64,${b64}`
              : null;
            abortFn =
              ev.actions && typeof ev.actions.abort === "function"
                ? () => ev.actions.abort()
                : null;
          } else if (t === QR.EXPIRED) {
            state.phase = "expired";
            state.imageDataUrl = null;
            abortFn =
              ev.actions && typeof ev.actions.abort === "function"
                ? () => ev.actions.abort()
                : null;
          } else if (t === QR.SCANNED) {
            state.phase = "await_confirm";
            state.scannedName = String(ev.data?.display_name || "") || null;
          } else if (t === QR.DECLINED) {
            state.phase = "declined";
            state.error = "qr_declined";
          } else if (t === QR.GOT_INFO && ev.data) {
            const payload = {
              imei: ev.data.imei,
              userAgent: ev.data.userAgent,
              cookie: ev.data.cookie,
            };
            state.phase = "writing";
            try {
              mkdirSync(path.dirname(credPath), { recursive: true });
              writeFileSync(
                credPath,
                JSON.stringify(payload, null, 2),
                "utf8"
              );
              state.credentialsWritten = true;
              state.phase = "done";
            } catch (e) {
              state.phase = "error";
              state.error = String(e?.message || e);
            }
          }
        }
      );
      if (
        state.phase !== "done" &&
        state.phase !== "error" &&
        state.phase !== "aborted" &&
        state.phase !== "declined"
      ) {
        if (!state.credentialsWritten) {
          state.phase = "error";
          state.error = "no_credentials_callback";
        }
      }
    } catch (e) {
      const name = e?.name || "";
      const msg = String(e?.message || e || "unknown");
      if (name === "ZaloApiLoginQRAborted" || /aborted/i.test(msg)) {
        state.phase = "aborted";
        state.error = null;
      } else {
        state.phase = "error";
        state.error = msg;
      }
    } finally {
      abortFn = null;
      busy = false;
    }
  })();
}
