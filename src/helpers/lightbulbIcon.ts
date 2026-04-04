import { nativeImage } from "electron/common";
import { resolve } from "path";

const lightbulbPath = resolve(__dirname, "lightbulb.png");

export const lightbulbIcon = nativeImage
  .createFromPath(lightbulbPath)
  .resize({ height: 16, width: 16 });
