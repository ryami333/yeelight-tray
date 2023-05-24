import { nativeImage } from "electron/common";
import { resolve } from "path";

export const seedlingIcon = nativeImage
  .createFromPath(resolve(__dirname, "../seedling.png"))
  .resize({
    height: 16,
    width: 16,
  });
