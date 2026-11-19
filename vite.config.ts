import { defineConfig } from "vitest/config";
import type { Connect } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error Plain ESM server module without type declarations
import { createApi } from "./server/api.mjs";

const serverFiles = /(^|\/)server\//;

function apiMiddleware(): Connect.NextHandleFunction {
  const api = createApi();
  return (req, res, next) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (serverFiles.test(path.slice(1)) || /%2f|%5c/i.test(path)) {
      res.statusCode = 404;
      return res.end();
    }
    api(req, res).then((handled: boolean) => handled || next(), next);
  };
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "talkin-ball-api",
      configureServer(server) {
        server.middlewares.use(apiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(apiMiddleware());
      },
    },
  ],
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts", css: false },
});
