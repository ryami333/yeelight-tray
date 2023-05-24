import { IYeelightMethodResponse } from "yeelight-service/lib/yeelight.interface";
import { sleep } from "./sleep";

export async function attemptDeviceCommand(
  fn: () => Promise<IYeelightMethodResponse>
): Promise<IYeelightMethodResponse> {
  const response = await fn();

  if (response.status === 410) {
    await sleep(200);
    return attemptDeviceCommand(fn);
  }

  return response;
}
