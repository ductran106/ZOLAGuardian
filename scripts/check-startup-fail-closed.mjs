#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8');

assert.match(src, /function scheduleStartupZaloRecovery\(err\)/, 'startup Zalo recovery helper must exist');
assert.match(src, /Fail-closed: thoát process để systemd retry/, 'startup failure must be logged as fail-closed');
assert.match(src, /scheduleFatalRecovery\("zalo startup\/login failed", err, \{[\s\S]*exitCode: 2/, 'startup login failures must schedule exit(2)');
assert.doesNotMatch(src, /Web UI \/ Guardian vẫn chạy — dùng Đăng nhập QR hoặc sửa file credentials/, 'old silent-web-alive startup failure path must be removed');
assert.match(src, /credentials file missing:/, 'configured-but-missing credentials must be fail-closed');
assert.match(src, /ZALO_GUARDIAN_SKIP_STARTUP_ZALO/, 'first-time QR bootstrap mode must be available');
assert.match(src, /Web UI \/ QR login vẫn hoạt động/, 'startup-skip mode must leave QR login available');
assert.match(src, /else if \(skipStartupZalo\)/, 'startup-skip mode must be separate from full skipZalo');
assert.match(src, /await new Promise\(\(\) => \{\}\);/, 'startup failure path must keep process alive until scheduled exit runs');

console.log('startup fail-closed checks PASS');
