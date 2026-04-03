import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    conditions: ["node"],
    alias: {
      // yeelight-service's nested tslib uses an ESM wrapper that does
      // `import tslib from '../tslib.js'` — Vite's CJS interop doesn't
      // produce a default export for this. Alias to the CJS entry directly.
      tslib: path.resolve(
        "node_modules/yeelight-service/node_modules/tslib/tslib.js",
      ),
    },
  },
});
