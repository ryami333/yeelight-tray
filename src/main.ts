import { app, Menu } from "electron";
import { nativeImage } from "electron/common";
import { MenuItem, Tray } from "electron/main";

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

interface DB {
  lastWatered: Date;
}

app
  .whenReady()
  .then(() => {
    const db = new Proxy(
      {
      lastWatered: new Date(),
      } satisfies DB,
      {
        set(...args) {
          const result = Reflect.set(...args);
          console.log("TODO: sync");
          return result;
        },
      }
    );

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

    const build = () => {
    const lastWateredMenuItem = new MenuItem({
        label: printLastWateredLabel(new Date(db.lastWatered)),
      type: "normal",
      enabled: false,
    });

    const wateredButton = new MenuItem({
      label: "I watered my plants today",
      type: "normal",
      click: () => {
          db.lastWatered = new Date();
        build();
      },
    });

    const menuTemplate = [lastWateredMenuItem, wateredButton];

      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    };

    build();
  })
  .catch(console.error);
