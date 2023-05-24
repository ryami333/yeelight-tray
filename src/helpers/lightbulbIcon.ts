import { nativeImage } from "electron/common";
import { app } from "electron/main";
import { resolve } from "path";

export const lightbulbIcon = nativeImage
  .createFromPath(resolve(app.getAppPath(), "lightbulb.png"))
  .resize({
    height: 16,
    width: 16,
  });
