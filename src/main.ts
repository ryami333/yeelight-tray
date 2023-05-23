import { app, Menu } from "electron";
import { nativeImage } from "electron/common";
import { Tray } from "electron/main";

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

app.whenReady().then(() => {
  let icon = nativeImage.createFromPath(
    "/Users/mitch/Desktop/Screenshot 2023-05-23 at 16.06.35.png"
  );
  icon = icon.resize({
    height: 16,
    width: 16,
  });
  const tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Item1", type: "radio" },
    { label: "Item2", type: "radio" },
  ]);

  // Make a change to the context menu
  contextMenu.items[1].checked = false;

  // Call this again for Linux because we modified the context menu
  tray.setContextMenu(contextMenu);
});
