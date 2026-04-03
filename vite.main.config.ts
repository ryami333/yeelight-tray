import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `curved-path`,
    // need to be told to use the Node.js entry point.
    conditions: ["node"],
    mainFields: ["module", "jsnext:main", "jsnext"],
  },
  define: {
    "process.env.commit": JSON.stringify(
      process.env.COMMIT_HASH ?? "local",
    ),
  },
});
