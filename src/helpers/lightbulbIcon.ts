import { nativeImage } from "electron/common";
import lightbulbPath from "../../lightbulb.png?asset";

export const lightbulbIcon = nativeImage.createFromPath(lightbulbPath).resize({
  height: 16,
  width: 16,
});
