import { nativeImage } from "electron/common";
import { app } from "electron/main";
import { resolve } from "path";

export const warningIcon = nativeImage
  .createFromPath(resolve(app.getAppPath(), "warning.png"))
  .resize({
    height: 16,
    width: 16,
  });
