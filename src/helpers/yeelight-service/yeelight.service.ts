/*
Service based on official Yeelight API Specification:
https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf
*/

import dgram from "dgram";
import os from "os";
import { z } from "zod";
import {
  IYeelight,
  IYeelightDevice,
  YeelightDeviceModelEnum,
  YeelightSupportedMethodsEnum,
  YeelightColorModeEnum,
} from "./yeelight.interface";
import { BehaviorSubject, Observable } from "rxjs";
import { map, filter } from "rxjs/operators";
import { notNullish } from "../notNullish";
import { YeelightDevice } from "./device.class";

function getLocalAddress(): string | undefined {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    if (!interfaces) continue;
    for (const net of interfaces) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
}

function parseHeaders(message: Buffer): Record<string, string> | undefined {
  let raw: string;
  try {
    raw = message.toString();
  } catch {
    return;
  }
  const result: Record<string, string> = {};
  for (const line of raw.split("\r\n")) {
    const i = line.indexOf(": ");
    if (i >= 0) {
      result[line.substring(0, i).toLowerCase()] = line.substring(i + 2);
    }
  }
  return result;
}

const discoverySchema = z.object({
  location: z
    .string()
    .transform((loc) => {
      const parts = loc.split(":");
      if (parts.length < 3) return undefined;
      const host = parts[1].replace("//", "");
      const port = Number(parts[2]);
      if (!host || !port) return undefined;
      return { host, port };
    })
    .pipe(z.object({ host: z.string(), port: z.number() })),
  id: z.string(),
  model: z.nativeEnum(YeelightDeviceModelEnum),
  support: z
    .string()
    .transform((s) =>
      s
        .split(" ")
        .filter((m): m is YeelightSupportedMethodsEnum =>
          Object.values<string>(YeelightSupportedMethodsEnum).includes(m),
        ),
    ),
  power: z.enum(["on", "off"]).optional(),
  bright: z.coerce.number().optional(),
  color_mode: z.coerce
    .number()
    .pipe(z.nativeEnum(YeelightColorModeEnum))
    .optional(),
  ct: z.coerce.number().optional(),
  rgb: z.coerce
    .number()
    .transform((v) => `#${v.toString(16)}`)
    .optional(),
  hue: z.coerce.number().optional(),
  sat: z.coerce.number().optional(),
  name: z.string().optional(),
});

export class YeelightService implements IYeelight {
  private readonly socket = dgram.createSocket("udp4");
  private readonly options = {
    port: 1982,
    multicastAddr: "239.255.255.250",
    discoveryMsg:
      'M-SEARCH * HTTP/1.1\r\nMAN: "ssdp:discover"\r\nST: wifi_bulb\r\n',
  };
  public devices = new BehaviorSubject<IYeelightDevice[]>([]);

  constructor() {
    this.listen();

    this.socket.on("message", (message: Buffer, address: dgram.RemoteInfo) => {
      if (getLocalAddress() === address.address) {
        return;
      }

      this.handleDiscovery(message);
    });
  }

  public getDeviceByName(name: string): Observable<IYeelightDevice> {
    return this.devices.pipe(
      map((devices) => devices.find((device) => device.name.value === name)),
      filter(notNullish),
    );
  }

  public getDeviceByModel(model: string): Observable<IYeelightDevice> {
    return this.devices.pipe(
      map((devices) => devices.find((device) => device.model === model)),
      filter(notNullish),
    );
  }

  public destroy(): void {
    this.devices.value.forEach((device) => {
      device.destroy();
    });
    this.socket.close();
  }

  private listen(): void {
    try {
      this.socket.bind(this.options.port, () => {
        this.socket.setBroadcast(true);
      });

      const buffer = Buffer.from(this.options.discoveryMsg);
      this.socket.send(
        buffer,
        0,
        buffer.length,
        this.options.port,
        this.options.multicastAddr,
      );
    } catch (ex) {
      return;
    }
  }

  private handleDiscovery(message: Buffer): void {
    const headers = parseHeaders(message);
    if (!headers) return;

    const result = discoverySchema.safeParse(headers);
    if (!result.success) return;

    const { location, id, model, support, ...props } = result.data;

    const device = new YeelightDevice(location.host, location.port);
    device.id = id;
    device.supportedMethods = support;
    device.model = model;
    device.brightness.next(props.bright);
    device.colorMode.next(props.color_mode);
    device.colorTemperature.next(props.ct);
    device.hue.next(props.hue);
    device.rgb.next(props.rgb);
    device.saturation.next(props.sat);
    device.name.next(props.name);
    device.power.next(props.power);

    const deviceIndex = this.devices?.value.findIndex(
      (registeredDevice) => registeredDevice.id === device.id,
    );

    if (deviceIndex >= 0) {
      this.devices.value[deviceIndex] = device;
      return;
    }

    device.connected.next(true);
    this.devices.next([...this.devices.value, device]);
  }
}
