// core/runtimeBuildInfo.js
// Đọc thông tin build runtime cho /api/runtime/build.
// Ưu tiên: build-info.json (do deploy script ghi) → package.json + .git (fallback dev).
// Không crash nếu thiếu file/quyền; trả về object JSON-safe luôn.

import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BUILD_INFO_PATH = path.join(ROOT, "build-info.json");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const GIT_DIR = path.join(ROOT, ".git");

function safeReadJson(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function safeReadText(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function readGitHead() {
  try {
    if (!existsSync(GIT_DIR)) return null;
    const headRaw = safeReadText(path.join(GIT_DIR, "HEAD"));
    if (!headRaw) return null;
    const head = headRaw.trim();
    let branch = null;
    let commit = null;
    const refMatch = /^ref:\s*(.+)$/.exec(head);
    if (refMatch) {
      const refPath = refMatch[1].trim();
      branch = refPath.replace(/^refs\/heads\//, "");
      const refContent = safeReadText(path.join(GIT_DIR, refPath));
      if (refContent) commit = refContent.trim().slice(0, 40) || null;
    } else if (/^[0-9a-f]{7,40}$/i.test(head)) {
      commit = head.slice(0, 40);
    }
    return { branch, commit };
  } catch {
    return null;
  }
}

function fileMtime(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    return statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

/**
 * @returns {{name:string|null,version:string|null,commit:string|null,
 *            branch:string|null,deployedAt:string|null,host:string|null,
 *            byUser:string|null,source:"build-info"|"package.json"|"fallback",
 *            buildInfoPath:string,buildInfoExists:boolean,packageMtime:string|null}}
 */
export function loadRuntimeBuildInfo() {
  const buildInfo = safeReadJson(BUILD_INFO_PATH);
  const pkg = safeReadJson(PACKAGE_JSON_PATH);
  const git = readGitHead();
  const pkgMtime = fileMtime(PACKAGE_JSON_PATH);
  const buildInfoExists = existsSync(BUILD_INFO_PATH);

  if (buildInfo && typeof buildInfo === "object") {
    return {
      name: buildInfo.name ?? pkg?.name ?? null,
      version: buildInfo.version ?? pkg?.version ?? null,
      commit: buildInfo.commit ?? git?.commit ?? null,
      branch: buildInfo.branch ?? git?.branch ?? null,
      deployedAt: buildInfo.deployedAt ?? null,
      host: buildInfo.host ?? null,
      byUser: buildInfo.byUser ?? null,
      source: "build-info",
      buildInfoPath: BUILD_INFO_PATH,
      buildInfoExists,
      packageMtime: pkgMtime,
    };
  }

  if (pkg && typeof pkg === "object") {
    return {
      name: pkg.name ?? null,
      version: pkg.version ?? null,
      commit: git?.commit ?? null,
      branch: git?.branch ?? null,
      deployedAt: null,
      host: null,
      byUser: null,
      source: "package.json",
      buildInfoPath: BUILD_INFO_PATH,
      buildInfoExists,
      packageMtime: pkgMtime,
    };
  }

  return {
    name: null,
    version: null,
    commit: git?.commit ?? null,
    branch: git?.branch ?? null,
    deployedAt: null,
    host: null,
    byUser: null,
    source: "fallback",
    buildInfoPath: BUILD_INFO_PATH,
    buildInfoExists,
    packageMtime: pkgMtime,
  };
}
