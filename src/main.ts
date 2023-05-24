import { app, Menu } from "electron";
import { MenuItem, Tray } from "electron/main";
import { YeelightService } from "yeelight-service";
import { IYeelightDevice } from "yeelight-service/lib/yeelight.interface";
// import { rgb } from "polished";
import { resolve } from "path";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { lightbulbIcon } from "./helpers/lightbulbIcon";
import { safeJsonParse } from "./helpers/safeJsonParse";
import { z } from "zod";
import ms from "ms";
import { attemptDeviceCommand } from "./helpers/attemptDeviceCommand";
import { rgb } from "polished";

const yeelightService = new YeelightService();

/**
 * Performance improvement:
 * https://www.electronjs.org/docs/latest/tutorial/performance#8-call-menusetapplicationmenunull-when-you-do-not-need-a-default-menu
 */
Menu.setApplicationMenu(null);

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

const APP_DATA_DIRECTORY = resolve(app.getPath("appData"), "yeelight-tray");
const DB_PATH = resolve(APP_DATA_DIRECTORY, "db.json");

interface DB {
  lastWatered: Date;
  warningThresholdDays: number;
}

if (!existsSync(APP_DATA_DIRECTORY)) {
  mkdirSync(APP_DATA_DIRECTORY, { recursive: true });
}

if (!existsSync(DB_PATH)) {
  writeFileSync(DB_PATH, "");
}

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

app
  .whenReady()
  .then(async () => {
    const db = new Proxy(initialState, {
      set(...args) {
        const result = Reflect.set(...args);
        sync();
        return result;
      },
    });

    let devices: IYeelightDevice[] = [];

    /*
     * ⚠️ Make sure you enabled the LAN Control option in the Yeelight app.
     */
    let subscriber = yeelightService.devices.subscribe((results) => {
      devices = results;
    });

    const resubscribe = () => {
      subscriber.unsubscribe();
      subscriber = yeelightService.devices.subscribe((results) => {
        devices = results;
      });
    };

    const sync = () => {
      writeFileSync(DB_PATH, JSON.stringify(db));
      build();
    };

    const tray = new Tray(lightbulbIcon);

    const powerOn = () => {
      for (const device of devices) {
        attemptDeviceCommand(() => device.setPower("on", "smooth"));
      }
    };

    const powerOff = () => {
      for (const device of devices) {
        attemptDeviceCommand(() => device.setPower("off", "smooth"));
      }
    };

    const changeBrightness = (level: number) => {
      for (const device of devices) {
        attemptDeviceCommand(() => device.setBrightness(level));
      }
    };

    const changeColorTemperature = (temperature: number) => {
      for (const device of devices) {
        attemptDeviceCommand(() => device.setColorTemperature(temperature));
      }
    };

    const changeRgb = (rgb: string) => {
      for (const device of devices) {
        attemptDeviceCommand(() => device.setRgb(rgb));
      }
    };

    const build = () => {
      tray.setContextMenu(
        Menu.buildFromTemplate([
          new MenuItem({
            type: "normal",
            label: "⏻ On",
            click: () => powerOn(),
          }),
          new MenuItem({
            type: "normal",
            label: "⏼ Off",
            click: () => powerOff(),
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            type: "submenu",
            label: "☀️ Brightness",
            submenu: Menu.buildFromTemplate(
              [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
                (level) =>
                  new MenuItem({
                    type: "normal",
                    label: String(level),
                    click: () => changeBrightness(level),
                  })
              )
            ),
          }),
          new MenuItem({
            type: "submenu",
            label: "🌡 Temperature",
            submenu: Menu.buildFromTemplate([
              {
                type: "normal",
                label: "4271K - Neutral",
                click: () => changeColorTemperature(4271),
              },
              {
                type: "normal",
                label: "2985K - Warm",
                click: () => changeColorTemperature(2985),
              },
              {
                type: "normal",
                label: "1700K - Warm",
                click: () => changeRgb(rgb(255, 121, 0)),
              },
            ]),
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            type: "normal",
            label: "↻ Resubscribe",
            click: () => resubscribe(),
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            type: "normal",
            label: "Quit",
            click: () => app.quit(),
          }),
          new MenuItem({
            type: "separator",
          }),
          new MenuItem({
            type: "normal",
            enabled: false,
            label: `Version: ${process.env.commit}`,
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
});
