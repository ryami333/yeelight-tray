import { defineConfig } from "vite";
import { cp } from "fs/promises";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    conditions: ["node"],
  },
  plugins: [
    {
      name: "copy-resources",
      async writeBundle(options) {
        if (!options.dir) return;
        await cp(resolve(__dirname, "resources"), resolve(options.dir), {
          recursive: true,
        });
      },
    },
  ],
});
