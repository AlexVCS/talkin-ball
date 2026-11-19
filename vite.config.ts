import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
// @ts-expect-error Plain ESM server module without type declarations
import { createApi } from "./server/api.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "talkin-ball-api",
      configureServer(server) {
        const api = createApi();
        server.middlewares.use(async (req, res, next) => {
          if (!(await api(req, res))) next();
        });
      },
    },
  ],
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts", css: false },
});
