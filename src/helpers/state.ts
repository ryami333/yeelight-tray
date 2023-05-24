import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { z } from "zod";
import { resolve } from "path";
import { app } from "electron/main";
import { safeJsonParse } from "./safeJsonParse";

const APP_DATA_DIRECTORY = resolve(app.getPath("appData"), "yeelight-tray");
const DB_PATH = resolve(APP_DATA_DIRECTORY, "db.json");

export interface State {
  lastWatered: Date;
  warningThresholdDays: number;
}

if (!existsSync(APP_DATA_DIRECTORY)) {
  mkdirSync(APP_DATA_DIRECTORY, { recursive: true });
}

if (!existsSync(DB_PATH)) {
  writeFileSync(DB_PATH, "");
}

export const readState = (): State => {
  return z
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
};

export const writeState = (state: State) =>
  writeFileSync(DB_PATH, JSON.stringify(state));
