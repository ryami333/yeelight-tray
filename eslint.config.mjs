import eslintJs from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/", "out/"]),
  eslintJs.configs.recommended,
  ...typescriptEslint.configs.recommended,
]);
