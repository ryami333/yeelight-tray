import { app, Menu } from "electron";
import { nativeImage } from "electron/common";
import { MenuItem, Tray } from "electron/main";
import { z } from "zod";
import { resolve } from "path";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import ms from "ms";

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

const DB_PATH = resolve(__dirname, "../db.json");

interface DB {
  lastWatered: Date;
  warningThresholdDays: number;
}

const safeJsonParse = (source: string) => {
  try {
    return JSON.parse(source);
  } catch {
    return undefined;
  }
};

const printDate = (date: Date) => {
  return format(date, "E do MMM" /* Mon 1st Jan */);
};

if (!existsSync(DB_PATH)) {
  writeFileSync(DB_PATH, "");
}

const getDaysSince = (date: Date) => differenceInCalendarDays(new Date(), date);

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
        warningThresholdDays: z.number().int(),
      })
      .catch({
        lastWatered: new Date(),
        warningThresholdDays: 10,
      })
      .parse(safeJsonParse(readFileSync(DB_PATH, "utf8")));

    const db = new Proxy(initialState, {
      set(...args) {
        const result = Reflect.set(...args);
        sync();
        return result;
      },
    });

    const seedlingIcon = nativeImage
      .createFromPath(resolve(__dirname, "../seedling.png"))
      .resize({
        height: 16,
        width: 16,
      });

    const warningIcon = nativeImage
      .createFromPath(resolve(__dirname, "../warning.png"))
      .resize({
        height: 16,
        width: 16,
      });

    const tray = new Tray(seedlingIcon);

    const build = () => {
      const today = new Date();
      const last30Days = Array(30)
        .fill(undefined)
        .map((_, index) => {
          return addDays(today, -1 * index);
        });

      const daysSinceLastWatered = getDaysSince(db.lastWatered);
      tray.setImage(
        daysSinceLastWatered > db.warningThresholdDays
          ? warningIcon
          : seedlingIcon
      );

      tray.setContextMenu(
        Menu.buildFromTemplate([
          new MenuItem({
            label: `Last watered: ${
              daysSinceLastWatered === 0
                ? "today"
                : `${printDate(
                    db.lastWatered
                  )} (${daysSinceLastWatered} days ago)`
            }`,
            type: "normal",
            enabled: false,
          }),
          new MenuItem({
            label: "I just watered my plants",
            type: "normal",
            click: () => {
              db.lastWatered = new Date();
            },
          }),
          new MenuItem({
            label: "I watered my plants on",
            type: "submenu",
            submenu: Menu.buildFromTemplate(
              last30Days.map((date) => {
                return new MenuItem({
                  type: "normal",
                  label: printDate(date),
                  click: () => {
                    db.lastWatered = date;
                  },
                });
              })
            ),
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            type: "submenu",
            label: "Settings",
            submenu: Menu.buildFromTemplate([
              {
                type: "submenu",
                label: "Warning threshold",
                submenu: Menu.buildFromTemplate(
                  Array(29)
                    .fill(undefined)
                    .map((_, index) => {
                      const days = index + 2;
                      return new MenuItem({
                        type: "normal",
                        label: `${days} days ${
                          db.warningThresholdDays === days ? "✓" : ""
                        }`,
                        click: () => {
                          db.warningThresholdDays = days;
                        },
                      });
                    })
                ),
              },
            ]),
          }),
          new MenuItem({
            type: "normal",
            label: "Quit",
            click: () => app.quit(),
          }),
        ])
      );
    };

    build();

    setInterval(() => build(), ms("2h"));
  })
  .catch(console.error);

app.dock.hide();

app.setLoginItemSettings({
  openAsHidden: true,
  openAtLogin: true,
});
