import { defineConfig } from "vite";
import { cp } from "fs/promises";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    conditions: ["node"],
  },
  plugins: [
    {
      name: "copy-lightbulb",
      async writeBundle(options) {
        const dest = resolve(options.dir!, "lightbulb.png");
        await cp(resolve(__dirname, "lightbulb.png"), dest);
      },
    },
  ],
});
