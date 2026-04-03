import eslintJs from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/", "out/", ".vite/"]),
  eslintJs.configs.recommended,
  ...typescriptEslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
]);
