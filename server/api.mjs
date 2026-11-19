import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import QUEUE from "./review-queue.json" with { type: "json" };

const SESSION_COOKIE = "tb_session";
const STATE_COOKIE = "tb_oauth_state";
const SESSION_TTL = 7 * 24 * 60 * 60;

const b64 = (s) => Buffer.from(s).toString("base64url");
const parseCookies = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k, v]) => k && v !== undefined)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]),
  );

export function createApi(env = process.env, fetchImpl = globalThis.fetch) {
  const clientId = env.TALKIN_BALL_GITHUB_CLIENT_ID || env.GITHUB_CLIENT_ID;
  const clientSecret =
    env.TALKIN_BALL_GITHUB_CLIENT_SECRET || env.GITHUB_CLIENT_SECRET;
  const adminLogin = (env.ADMIN_GITHUB_LOGIN || "AlexVCS").toLowerCase();
  const secret =
    env.SESSION_SECRET ||
    (clientSecret
      ? createHmac("sha256", clientSecret).update("tb-session").digest("hex")
      : randomBytes(32).toString("hex"));
  const configured = Boolean(clientId && clientSecret);

  const sign = (value) =>
    createHmac("sha256", secret).update(value).digest("base64url");
  const origin = (req) => {
    if (env.PUBLIC_URL) return env.PUBLIC_URL.replace(/\/$/, "");
    const proto = req.headers["x-forwarded-proto"]?.split(",")[0] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return `${proto}://${host}`;
  };
  const cookie = (req, name, value, maxAge) =>
    [
      `${name}=${value}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${maxAge}`,
      ...(origin(req).startsWith("https:") ? ["Secure"] : []),
    ].join("; ");
  const isAdmin = (login) =>
    typeof login === "string" && login.toLowerCase() === adminLogin;

  const readSession = (req) => {
    const raw = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (!raw) return null;
    const [payload, mac] = raw.split(".");
    if (!payload || !mac) return null;
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(mac);
    if (expected.length !== given.length || !timingSafeEqual(expected, given))
      return null;
    try {
      const session = JSON.parse(Buffer.from(payload, "base64url").toString());
      if (session.exp < Date.now() / 1000 || !isAdmin(session.login))
        return null;
      return session;
    } catch {
      return null;
    }
  };
  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(body === undefined
        ? {}
        : { "Content-Type": "application/json; charset=utf-8" }),
      ...headers,
    });
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };
  const redirect = (res, location, cookies = []) =>
    send(res, 302, undefined, { Location: location, "Set-Cookie": cookies });

  async function callback(req, res, url) {
    const state = parseCookies(req.headers.cookie)[STATE_COOKIE];
    const clearState = cookie(req, STATE_COOKIE, "", 0);
    const code = url.searchParams.get("code");
    if (
      !configured ||
      !code ||
      !state ||
      state !== url.searchParams.get("state")
    )
      return redirect(res, "/?auth=error#review", [clearState]);
    try {
      const token = await fetchImpl(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: `${origin(req)}/auth/github/callback`,
          }),
        },
      ).then((r) => r.json());
      if (!token.access_token) throw new Error("No access token");
      const user = await fetchImpl("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token.access_token}`,
          "User-Agent": "talkin-ball",
        },
      }).then((r) => (r.ok ? r.json() : {}));
      if (!isAdmin(user.login))
        return redirect(res, "/?auth=denied#review", [clearState]);
      const payload = b64(
        JSON.stringify({
          login: user.login,
          exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
        }),
      );
      return redirect(res, "/#review", [
        clearState,
        cookie(req, SESSION_COOKIE, `${payload}.${sign(payload)}`, SESSION_TTL),
      ]);
    } catch {
      return redirect(res, "/?auth=error#review", [clearState]);
    }
  }

  return async function handle(req, res) {
    const url = new URL(req.url, "http://localhost");
    const route = `${req.method} ${url.pathname}`;
    switch (route) {
      case "GET /admin":
        redirect(res, "/#review");
        return true;
      case "GET /api/session": {
        const session = readSession(req);
        send(res, 200, {
          configured,
          admin: Boolean(session),
          login: session?.login ?? null,
        });
        return true;
      }
      case "GET /api/review-queue":
        if (readSession(req)) send(res, 200, QUEUE);
        else send(res, 401, { error: "Admin sign-in required" });
        return true;
      case "GET /auth/github": {
        if (!configured) {
          redirect(res, "/?auth=unconfigured#review");
          return true;
        }
        const state = randomBytes(16).toString("hex");
        const authorize = new URL("https://github.com/login/oauth/authorize");
        authorize.search = new URLSearchParams({
          client_id: clientId,
          redirect_uri: `${origin(req)}/auth/github/callback`,
          state,
          allow_signup: "false",
        }).toString();
        redirect(res, authorize.toString(), [
          cookie(req, STATE_COOKIE, state, 600),
        ]);
        return true;
      }
      case "GET /auth/github/callback":
        await callback(req, res, url);
        return true;
      case "POST /auth/signout":
        send(res, 204, undefined, {
          "Set-Cookie": cookie(req, SESSION_COOKIE, "", 0),
        });
        return true;
    }
    return false;
  };
}
