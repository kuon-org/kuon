import { UAParser } from "ua-parser-js";

export function getDeviceNameFromUserAgent(
  userAgent?: string,
): string | undefined {
  if (!userAgent) return undefined;

  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  const device = parser.getDevice();
  const browser = parser.getBrowser();

  const deviceParts: string[] = [];
  if (device.vendor) deviceParts.push(device.vendor);
  if (device.model) deviceParts.push(device.model);
  if (device.type) deviceParts.push(device.type);

  if (deviceParts.length > 0) {
    return deviceParts.join(" ");
  }

  const osParts: string[] = [];
  if (os.name) osParts.push(os.name);
  if (os.version) osParts.push(os.version);
  if (browser.name) osParts.push(browser.name);

  return osParts.length > 0 ? osParts.join(" ") : undefined;
}
