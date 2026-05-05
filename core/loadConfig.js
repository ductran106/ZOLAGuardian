// core/loadConfig.js
// Đọc config.json + ghi đè bằng biến môi trường (file `.env` ở thư mục gốc).
// Không dùng package dotenv — parser .env tối giản.
//
// Biến .env (ưu tiên ghi đè):
//   ZALO_CREDENTIALS_PATH  — file credentials (mặc định: data/zalo-credentials.json)
//   ZCA_JS_PATH            — zca-js dist/index.js (mặc định: node_modules/zca-js nếu có)
//   BOT_USER_ID            — tuỳ chọn (tham chiếu vận hành)
//   DM_ADMIN_ID            — user id admin nhận DM Zalo
//   TELEGRAM_BOT_TOKEN     — BotFather
//   TELEGRAM_CHAT_ID       — chat / nhóm Telegram nhận chứng minh
//   WEBUI_BASIC_USER       — Basic Auth cho Web UI (tùy chọn)
//   WEBUI_BASIC_PASSWORD
//
// Alias: CREDENTIALS_PATH, ZCA_PATH

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (let line of raw.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

parseEnvFile(path.join(ROOT, ".env"));

function str(v) {
  if (v == null || v === "") return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

/**
 * @returns {Record<string, unknown>}
 */
export function loadConfig() {
  const configPath = path.join(ROOT, "config.json");
  const base = JSON.parse(readFileSync(configPath, "utf8"));

  const e = process.env;

  let credentialsPath =
    str(e.ZALO_CREDENTIALS_PATH) ??
    str(e.CREDENTIALS_PATH) ??
    str(base.credentialsPath);

  let zcaPath =
    str(e.ZCA_JS_PATH) ??
    str(e.ZCA_PATH) ??
    str(base.zcaPath);

  const bundledZca = path.join(ROOT, "node_modules", "zca-js", "dist", "index.js");
  if (!zcaPath && existsSync(bundledZca)) {
    zcaPath = bundledZca;
  }

  if (!credentialsPath) {
    credentialsPath = path.join(ROOT, "data", "zalo-credentials.json");
  }

  const botUserId =
    str(e.BOT_USER_ID) ?? str(base.botUserId);

  const dmAdminId =
    str(e.DM_ADMIN_ID) ?? str(base.dmAdminId);

  const telegramBotToken =
    str(e.TELEGRAM_BOT_TOKEN) ?? str(base.telegramBotToken);

  const telegramChatId =
    str(e.TELEGRAM_CHAT_ID) ?? str(base.telegramChatId);

  const webuiBasicUser =
    str(e.WEBUI_BASIC_USER) ?? str(base.webuiBasicUser);

  const webuiBasicPassword =
    str(e.WEBUI_BASIC_PASSWORD) ?? str(base.webuiBasicPassword);

  return {
    ...base,
    credentialsPath: credentialsPath ?? "",
    zcaPath: zcaPath ?? "",
    botUserId: botUserId ?? "",
    dmAdminId: dmAdminId ?? "",
    telegramBotToken: telegramBotToken ?? "",
    telegramChatId: telegramChatId ?? "",
    webuiBasicUser: webuiBasicUser ?? "",
    webuiBasicPassword: webuiBasicPassword ?? "",
  };
}
