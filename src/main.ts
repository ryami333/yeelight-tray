import { app, Menu } from "electron";
import { nativeImage } from "electron/common";
import { MenuItem, Tray } from "electron/main";
import { z } from "zod";
import { resolve } from "path";
import { writeFileSync, readFileSync, existsSync } from "fs";

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

const DB_PATH = resolve(__dirname, "../db.json");

interface DB {
  lastWatered: Date;
}

const safeJsonParse = (source: string) => {
  try {
    return JSON.parse(source);
  } catch {
    return undefined;
  }
};

if (!existsSync(DB_PATH)) {
  writeFileSync(DB_PATH, "");
}

app
  .whenReady()
  .then(() => {
    const sync = () => {
      writeFileSync(DB_PATH, JSON.stringify(db));
      build();
    };

    const initialState: DB = z
      .object({
        lastWatered: z
          .string()
          .datetime()
          .transform((str) => new Date(str)),
      })
      .catch({
        lastWatered: new Date(),
      })
      .parse(safeJsonParse(readFileSync(DB_PATH, "utf8")));

    const db = new Proxy(initialState, {
      set(...args) {
        const result = Reflect.set(...args);
        sync();
        return result;
      },
    });

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
        },
      });

      const menuTemplate = [lastWateredMenuItem, wateredButton];

      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    };

    build();
  })
  .catch(console.error);
