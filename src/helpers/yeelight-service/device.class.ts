import { BehaviorSubject } from "rxjs";
import net from "node:net";
import { z } from "zod";
import {
  YeelightDeviceModelEnum,
  YeelightSupportedMethodsEnum,
  YeelightPowerState,
  YeelightColorModeEnum,
  IYeelightMethodResponse,
  YeelightEffect,
  YeelightMethodStatusEnum,
  YeelightSupportedPropertiesEnum,
  TYeelightParams,
  IYeelightDevice,
} from "./yeelight.interface";

const propsMessageSchema = z.object({
  method: z.literal("props"),
  params: z.record(z.string(), z.string()),
});

export class YeelightDevice implements IYeelightDevice {
  private readonly defaults: { effect: YeelightEffect; duration: number } = {
    effect: "smooth",
    duration: 1000,
  };

  public connected = new BehaviorSubject<boolean>(false);
  private readonly socket = new net.Socket();
  public id!: string;
  public model!: YeelightDeviceModelEnum;
  public supportedMethods!: YeelightSupportedMethodsEnum[];

  public name = new BehaviorSubject<string | undefined>(undefined);
  public power = new BehaviorSubject<YeelightPowerState | undefined>(undefined);
  public brightness = new BehaviorSubject<number | undefined>(undefined);
  public colorTemperature = new BehaviorSubject<number | undefined>(undefined);
  public rgb = new BehaviorSubject<string | undefined>(undefined);
  public hue = new BehaviorSubject<number | undefined>(undefined);
  public saturation = new BehaviorSubject<number | undefined>(undefined);
  public colorMode = new BehaviorSubject<YeelightColorModeEnum | undefined>(
    undefined,
  );

  constructor(host: string, port: number) {
    this.socket.connect(port, host, () => {
      this.connected.next(true);
    });
    this.socket.setKeepAlive(true, 60000);

    this.socket.on("data", (socketMessage: Buffer) => {
      this.handleSocketMessage(socketMessage);
    });

    this.socket.on("error", () => {
      this.destroy();
    });
  }

  public destroy(): void {
    this.socket.destroy();
    this.connected.next(false);
  }

  /* Methods */
  public async setName(name: string): Promise<IYeelightMethodResponse> {
    const method = YeelightSupportedMethodsEnum.setName;
    const params = [name];
    return this.castMethod(method, params);
  }

  public async setAsDefault(): Promise<IYeelightMethodResponse> {
    const method = YeelightSupportedMethodsEnum.setDefault;
    return this.castMethod(method);
  }

  public async togglePower(): Promise<IYeelightMethodResponse> {
    const method = YeelightSupportedMethodsEnum.toggle;
    return this.castMethod(method);
  }

  public async setPower(
    powerState: YeelightPowerState,
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (powerState !== "on" && powerState !== "off") {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Power parameter should be "on" or "off".`,
      );
    }

    const method = YeelightSupportedMethodsEnum.setPower;
    const params = [powerState, effect, duration];

    return this.castMethod(method, params);
  }

  public async setColorTemperature(
    colorTemperature: number,
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (
      !colorTemperature ||
      colorTemperature < 2700 ||
      colorTemperature > 6500
    ) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Color temperature is not a number in the range of 2700 ~ 6500.`,
      );
    }

    const method = YeelightSupportedMethodsEnum.setTemperature;
    const params = [colorTemperature, effect, duration];

    return this.castMethod(method, params);
  }

  public async setRgb(
    rgb: string | number | number[],
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (
      typeof rgb === "string" &&
      rgb.match(/^(#)((?:[A-Fa-f0-9]{3}){1,2})$/)
    ) {
      rgb = parseInt(rgb.substring(1), 16);
    }

    if (typeof rgb === "object") {
      rgb = (rgb[0] << (16 + rgb[1])) << (16 + rgb[2]);
    }

    rgb = Number(rgb);

    if (isNaN(rgb) || rgb < 0 || rgb > 16777215) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `RGB color is missing or it's not valid HEX RGB Color.`,
      );
    }

    const method = YeelightSupportedMethodsEnum.setRgb;
    const params = [rgb, effect, duration];

    return this.castMethod(method, params);
  }

  public async setHsv(
    hue: number,
    saturation: number,
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (hue < 0 || hue > 359) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Hue is missing or it's not valid hue value (range from 0 to 359).`,
      );
    }

    if (saturation < 0 || saturation > 100) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Saturation is missing or it's not valid saturation value (range from 0 to 100).`,
      );
    }

    const method = YeelightSupportedMethodsEnum.setHsv;
    const params = [hue, saturation, effect, duration];

    return this.castMethod(method, params);
  }

  public async setBrightness(
    brightness: number,
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (brightness < 0 || brightness > 100) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Brigtness should be number in range from 0 to 100 (percent).`,
      );
    }

    const method = YeelightSupportedMethodsEnum.setBrightness;
    const params = [brightness, effect, duration];

    return this.castMethod(method, params);
  }

  public async adjustBrightness(
    difference: number,
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (difference < -100 || difference > 100) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Brigtness adjustment should be number in range from -100 to 100 (percent).`,
      );
    }

    const method = YeelightSupportedMethodsEnum.adjustBrightness;
    const params = [difference, effect, duration];
    return this.castMethod(method, params);
  }

  public async adjustTemperature(
    difference: number,
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (difference < -100 || difference > 100) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Temperature adjustment should be number in range from -100 to 100 (percent).`,
      );
    }

    const method = YeelightSupportedMethodsEnum.adjustTemperature;
    const params = [difference, effect, duration];
    return this.castMethod(method, params);
  }

  public async adjustColor(
    difference: number,
    effect: YeelightEffect = this.defaults.effect,
    duration: number = this.defaults.duration,
  ): Promise<IYeelightMethodResponse> {
    if (!this.isEffectValid(effect)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Effect should be "smooth" or "sudden".`,
      );
    }

    if (!this.isDurationValid(duration)) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Duration should be number not lower than 300ms.`,
      );
    }

    if (difference < -100 || difference > 100) {
      return this.throwError(
        YeelightMethodStatusEnum.BAD_REQUEST,
        `Color adjustment should be number in range from -100 to 100 (percent).`,
      );
    }

    const method = YeelightSupportedMethodsEnum.adjustColor;
    const params = [difference, effect, duration];
    return this.castMethod(method, params);
  }

  private isDurationValid(duration: number): boolean {
    if (isNaN(Number(duration)) || duration < 300) {
      return false;
    }
    return true;
  }

  private isEffectValid(effect: YeelightEffect): boolean {
    if (effect !== "smooth" && effect !== "sudden") {
      return false;
    }
    return true;
  }

  /* Handling data and casting methods */
  private handleSocketMessage(socketMessage: Buffer): void {
    const stringSocketMessage = socketMessage.toString();

    if (stringSocketMessage.length <= 0) {
      return; // not a valid message
    }

    const stringJsons = stringSocketMessage.split(/\r?\n/).filter(Boolean);

    stringJsons.forEach((stringJson) => {
      let json: unknown;
      try {
        json = JSON.parse(stringJson);
      } catch {
        return; // not a JSON object, continue
      }

      const result = propsMessageSchema.safeParse(json);
      if (result.success) {
        this.handleProperties(result.data.params);
      }
    });
  }

  private handleProperties(
    params: z.output<typeof propsMessageSchema>["params"],
  ): void {
    for (const param in params) {
      if (!param) {
        return;
      }

      const value = params[param];

      switch (param) {
        case YeelightSupportedPropertiesEnum.power:
          if (value === "on" || value === "off") {
            this.power.next(value);
          }
          break;
        case YeelightSupportedPropertiesEnum.brightness:
          this.brightness.next(Number(value));
          break;
        case YeelightSupportedPropertiesEnum.colorTemperature:
          this.colorTemperature.next(Number(value));
          break;
        case YeelightSupportedPropertiesEnum.rgb:
          this.rgb.next(`#${Number(value).toString(16)}`);
          break;
        case YeelightSupportedPropertiesEnum.hue:
          this.hue.next(Number(value));
          break;
        case YeelightSupportedPropertiesEnum.saturation:
          this.saturation.next(Number(value));
          break;
        case YeelightSupportedPropertiesEnum.colorMode:
          this.colorMode.next(Number(value));
          break;
        case YeelightSupportedPropertiesEnum.name:
          this.name.next(value);
          break;
        default:
          break;
      }
    }
  }

  private async castMethod(
    method: YeelightSupportedMethodsEnum,
    params: TYeelightParams = [],
  ): Promise<IYeelightMethodResponse> {
    const id = 1;

    if (this.connected.value === false || this.socket === null) {
      return this.throwError(
        YeelightMethodStatusEnum.DEVICE_DISCONNECTED,
        `Device is disconnected.`,
      );
    }

    if (!this.supportedMethods.includes(method)) {
      return this.throwError(
        YeelightMethodStatusEnum.METHOD_NOT_SUPPORTED,
        `Method ${method} is not allowed for device ${this.name.value ?? this.model}.`,
      );
    }

    const result = await this.sendCommand({
      id,
      method,
      params,
    });
    return result;
  }

  public async sendCommand(command: {
    id: number;
    method: string;
    params: TYeelightParams;
  }): Promise<IYeelightMethodResponse> {
    return new Promise<IYeelightMethodResponse>((resolve) => {
      const message = JSON.stringify(command);

      this.socket.write(message + "\r\n", "utf-8", () => {
        this.socket.on("data", (socketMessage: Buffer) => {
          const stringJsons = socketMessage
            .toString()
            .split(/\r?\n/)
            .filter(Boolean);
          for (const stringJson of stringJsons) {
            if (stringJson.length <= 1) {
              return; // invalid or empty response, continue
            }

            try {
              JSON.parse(stringJson);
            } catch {
              return; // not a JSON object, continue
            }

            const data: {
              id: number;
              error?: { code: number; message: string };
              result?: string[];
            } = JSON.parse(stringJson);

            if (!data.id || data.id !== 1) {
              return;
            }

            if (data.error) {
              resolve(
                this.throwError(
                  YeelightMethodStatusEnum.YEELIGHT_DEVICE_ERROR,
                  data.error.message,
                ),
              );
              return;
            }

            resolve(this.setResponse(YeelightMethodStatusEnum.OK));
          }
        });
      });
    });
  }

  /* Responses */
  private setResponse(code: YeelightMethodStatusEnum): IYeelightMethodResponse {
    return {
      status: code,
    };
  }

  private throwError(
    code: YeelightMethodStatusEnum,
    message: string,
  ): IYeelightMethodResponse {
    return {
      status: code,
      errorMessage: message,
    };
  }
}
