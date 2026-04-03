import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import z from "zod";

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
export const env = createEnv({
  server: {
    APPLE_ID: z.email(),
    APPLE_ID_PASSWORD: z.string().nonempty(),
    APPLE_TEAM_ID: z.string().nonempty(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  // eslint-disable-next-line no-undef
  runtimeEnv: process.env,
});

const config = {
  packagerConfig: {
    name: "Yeelight Tray",
    executableName: "Yeelight Tray",
    icon: "./icons/icon",
    osxSign: {},
    osxNotarize: {
      appleId: env.APPLE_ID,
      appleIdPassword: env.APPLE_ID_PASSWORD,
      teamId: env.APPLE_TEAM_ID,
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-vite",
      config: {
        build: [
          {
            entry: "src/main.ts",
            config: "vite.main.config.ts",
          },
          {
            entry: "src/preload.ts",
            config: "vite.preload.config.ts",
            target: "preload",
          },
        ],
        renderer: [
          {
            name: "main_window",
            config: "vite.renderer.config.ts",
          },
        ],
      },
    },
  ],
};

export default config;
