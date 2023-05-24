import { nativeImage } from "electron/common";
import { resolve } from "path";

export const warningIcon = nativeImage
  .createFromPath(resolve(__dirname, "../warning.png"))
  .resize({
    height: 16,
    width: 16,
  });
