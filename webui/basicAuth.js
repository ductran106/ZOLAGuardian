// webui/basicAuth.js — Basic Auth cho HTTP + kiểm tra header cho WS upgrade

function parseBasicAuthHeader(header) {
  if (!header || typeof header !== "string" || !header.startsWith("Basic ")) {
    return null;
  }
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const i = decoded.indexOf(":");
    if (i < 0) return null;
    return { user: decoded.slice(0, i), password: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

export function getWebUiCredentials(config) {
  const e = process.env;
  const user =
    String(config?.webuiBasicUser ?? e.WEBUI_BASIC_USER ?? "").trim() ||
    "";
  const password =
    String(config?.webuiBasicPassword ?? e.WEBUI_BASIC_PASSWORD ?? "").trim() ||
    "";
  return { user, password };
}

export function isWebUiAuthConfigured(config) {
  const { user, password } = getWebUiCredentials(config);
  return Boolean(user && password);
}

export function verifyBasicAuth(req, config) {
  const { user, password } = getWebUiCredentials(config);
  if (!user || !password) return true;
  const parsed = parseBasicAuthHeader(req.headers?.authorization);
  if (!parsed) return false;
  return parsed.user === user && parsed.password === password;
}

export function webUiBasicAuthMiddleware(config) {
  return (req, res, next) => {
    if (!isWebUiAuthConfigured(config)) return next();
    if (verifyBasicAuth(req, config)) return next();
    res.setHeader("WWW-Authenticate", 'Basic realm="Zalo Guardian"');
    res.status(401).send("Unauthorized");
  };
}
