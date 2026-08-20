import { UAParser } from "ua-parser-js";
export function getDeviceNameFromUserAgent(userAgent) {
    if (!userAgent)
        return undefined;
    const parser = new UAParser(userAgent);
    const os = parser.getOS();
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const deviceParts = [];
    if (device.vendor)
        deviceParts.push(device.vendor);
    if (device.model)
        deviceParts.push(device.model);
    if (device.type)
        deviceParts.push(device.type);
    if (deviceParts.length > 0) {
        return deviceParts.join(" ");
    }
    const osParts = [];
    if (os.name)
        osParts.push(os.name);
    if (os.version)
        osParts.push(os.version);
    if (browser.name)
        osParts.push(browser.name);
    return osParts.length > 0 ? osParts.join(" ") : undefined;
}
