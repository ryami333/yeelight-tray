import { app, Menu } from "electron";
import { nativeImage } from "electron/common";
import { MenuItem, Tray } from "electron/main";

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

app
  .whenReady()
  .then(() => {
    let icon = nativeImage.createFromPath(
      "/Users/mitch/Desktop/Screenshot 2023-05-23 at 16.06.35.png"
    );
    icon = icon.resize({
      height: 16,
      width: 16,
    });
    const tray = new Tray(icon);

    let contextMenu: Menu;

    const printLastWateredLabel = (date: Date) => `Last watered: ${date}`;

    const lastWateredMenuItem = new MenuItem({
      label: printLastWateredLabel(new Date()),
      type: "normal",
      enabled: false,
    });

    const wateredButton = new MenuItem({
      label: "I watered my plants today",
      type: "normal",
      click: () => {
        lastWateredMenuItem.label = "Updated";
        build();
      },
    });

    const menuTemplate = [lastWateredMenuItem, wateredButton];

    const build = () => {
      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    };

    build();
  })
  .catch(console.error);
