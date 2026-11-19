import { describe, expect, it, vi } from "vitest";
import { createApi } from "./api.mjs";

const ENV = {
  TALKIN_BALL_GITHUB_CLIENT_ID: "client",
  TALKIN_BALL_GITHUB_CLIENT_SECRET: "secret",
  SESSION_SECRET: "test-session",
};

function call(api, method, path, cookie) {
  return new Promise((resolve, reject) => {
    const res = {
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
      },
      end(body) {
        resolve({
          status: this.status,
          headers: this.headers,
          body: body ? JSON.parse(body) : undefined,
        });
      },
    };
    api(
      { method, url: path, headers: { host: "example.test", cookie } },
      res,
    ).catch(reject);
  });
}
const cookies = (r) =>
  [r.headers["Set-Cookie"]].flat().map((c) => c.split(";")[0]);

function github(login) {
  return vi.fn(async (url) =>
    url.includes("access_token")
      ? new Response(JSON.stringify({ access_token: "token" }))
      : new Response(JSON.stringify({ login })),
  );
}
async function signIn(login, env = ENV) {
  const api = createApi(env, github(login));
  const start = await call(api, "GET", "/auth/github");
  const state = new URL(start.headers.Location).searchParams.get("state");
  const back = await call(
    api,
    "GET",
    `/auth/github/callback?code=abc&state=${state}`,
    cookies(start)[0],
  );
  return { api, back };
}

describe("admin API", () => {
  it("keeps the queue from visitors", async () => {
    const api = createApi(ENV, github("AlexVCS"));
    expect((await call(api, "GET", "/api/review-queue")).status).toBe(401);
    expect((await call(api, "GET", "/api/session")).body).toEqual({
      configured: true,
      admin: false,
      login: null,
    });
  });
  it("lets AlexVCS sign in and read the queue", async () => {
    const { api, back } = await signIn("alexvcs");
    expect(back.headers.Location).toBe("/#review");
    const session = cookies(back).find((c) => c.startsWith("tb_session="));
    const queue = await call(api, "GET", "/api/review-queue", session);
    expect(queue.status).toBe(200);
    expect(queue.body).toHaveLength(3);
    expect((await call(api, "GET", "/api/session", session)).body.admin).toBe(
      true,
    );
  });
  it("turns away other GitHub accounts", async () => {
    const { back } = await signIn("someone-else");
    expect(back.headers.Location).toBe("/?auth=denied#review");
    expect(cookies(back).some((c) => c.startsWith("tb_session=e"))).toBe(false);
  });
  it("rejects a mismatched OAuth state", async () => {
    const api = createApi(ENV, github("AlexVCS"));
    const back = await call(
      api,
      "GET",
      "/auth/github/callback?code=abc&state=forged",
      "tb_oauth_state=real",
    );
    expect(back.headers.Location).toBe("/?auth=error#review");
  });
  it("rejects a tampered session cookie", async () => {
    const { api, back } = await signIn("AlexVCS");
    const session = cookies(back).find((c) => c.startsWith("tb_session="));
    const forged = session.replace(
      /\.(.)/,
      (_, c) => `.${c === "a" ? "b" : "a"}`,
    );
    expect((await call(api, "GET", "/api/review-queue", forged)).status).toBe(
      401,
    );
  });
  it("reports when GitHub sign-in is not configured", async () => {
    const api = createApi({}, github("AlexVCS"));
    expect((await call(api, "GET", "/api/session")).body.configured).toBe(
      false,
    );
    expect((await call(api, "GET", "/auth/github")).headers.Location).toBe(
      "/?auth=unconfigured#review",
    );
  });
});

describe("cookie parsing", () => {
  it("ignores unrelated cookies with stray percent signs", async () => {
    const api = createApi(ENV, github("AlexVCS"));
    const res = await call(api, "GET", "/api/session", "other=100%; x=%E0");
    expect(res.status).toBe(200);
  });
});
