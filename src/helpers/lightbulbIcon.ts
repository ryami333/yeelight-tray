import { nativeImage } from "electron/common";
import { app } from "electron/main";
import { resolve, dirname } from "path";

const resourcePath = app.isPackaged
  ? resolve(process.resourcesPath, "lightbulb.png")
  : resolve(dirname(app.getAppPath()), "lightbulb.png");

export const lightbulbIcon = nativeImage.createFromPath(resourcePath).resize({
  height: 16,
  width: 16,
});
