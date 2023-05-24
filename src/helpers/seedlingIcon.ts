import { nativeImage } from "electron/common";
import { app } from "electron/main";
import { resolve } from "path";

export const seedlingIcon = nativeImage
  .createFromPath(resolve(app.getAppPath(), "seedling.png"))
  .resize({
    height: 16,
    width: 16,
  });
