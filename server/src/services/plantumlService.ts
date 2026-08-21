import { deflateRawSync } from "node:zlib";

const OFFICIAL_PLANTUML_URL = "https://www.plantuml.com/plantuml";

const SUPPORTED_FORMATS = {
  svg: "image/svg+xml",
  png: "image/png",
} as const;

type PlantUMLFormat = keyof typeof SUPPORTED_FORMATS;

type PlantUMLTarget = {
  url: string;
  official: boolean;
};

const normalizePlantUMLUrl = (
  configuredUrl: string | undefined,
): PlantUMLTarget => {
  if (!configuredUrl?.trim()) {
    return {
      url: OFFICIAL_PLANTUML_URL,
      official: true,
    };
  }

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("Invalid PLANTUML_URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("PLANTUML_URL must use http or https");
  }

  // Remove trailing slashes so that URL construction is predictable.
  url.pathname = url.pathname.replace(/\/+$/, "");

  const official =
    url.protocol === "https:" &&
    url.hostname === "www.plantuml.com" &&
    url.pathname === "/plantuml" &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash;

  return {
    url: url.toString().replace(/\/+$/, ""),
    official,
  };
};

/**
 * PlantUML's custom 6-bit encoding.
 *
 * UTF-8 -> Deflate (raw) -> PlantUML encoding
 */
const encode6bit = (value: number): string => {
  if (value < 10) {
    return String.fromCharCode(48 + value);
  }

  if (value < 36) {
    return String.fromCharCode(65 + value - 10);
  }

  if (value < 62) {
    return String.fromCharCode(97 + value - 36);
  }

  if (value === 62) {
    return "-";
  }

  if (value === 63) {
    return "_";
  }

  throw new Error(`Invalid PlantUML 6-bit value: ${value}`);
};

const append3Bytes = (b1: number, b2: number, b3: number): string => {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x03) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0x0f) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;

  return (
    encode6bit(c1 & 0x3f) +
    encode6bit(c2 & 0x3f) +
    encode6bit(c3 & 0x3f) +
    encode6bit(c4 & 0x3f)
  );
};

const encodePlantUML = (diagram: string): string => {
  const compressed = deflateRawSync(Buffer.from(diagram, "utf8"));

  let result = "";

  for (let i = 0; i < compressed.length; i += 3) {
    const b1 = compressed[i];
    const b2 = compressed[i + 1] ?? 0;
    const b3 = compressed[i + 2] ?? 0;

    result += append3Bytes(b1, b2, b3);
  }

  return result;
};

export class PlantUMLService {
  async renderPlantUML(format: string, diagram: string) {
    if (!(format in SUPPORTED_FORMATS)) {
      throw new Error(`Unsupported PlantUML format: ${format}`);
    }

    const target = normalizePlantUMLUrl(process.env.PLANTUML_URL);

    const response = target.official
      ? await this.renderOfficial(target.url, format as PlantUMLFormat, diagram)
      : await this.renderSelfHosted(
          target.url,
          format as PlantUMLFormat,
          diagram,
        );

    if (!response.ok) {
      throw new Error(
        `PlantUML fetch failed: ${response.status} ${response.statusText}`,
      );
    }

    const expectedContentType = SUPPORTED_FORMATS[format as PlantUMLFormat];

    const actualContentType = response.headers.get("content-type");

    if (!actualContentType?.toLowerCase().startsWith(expectedContentType)) {
      throw new Error(
        `Invalid PlantUML response: ${actualContentType ?? "unknown"}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      buffer,
      contentType: expectedContentType,
    };
  }

  private renderOfficial(
    baseUrl: string,
    format: PlantUMLFormat,
    diagram: string,
  ) {
    const encoded = encodePlantUML(diagram);

    return fetch(`${baseUrl}/${format}/${encoded}`, {
      method: "GET",
      headers: {
        Accept: SUPPORTED_FORMATS[format],
      },
    });
  }

  private renderSelfHosted(
    baseUrl: string,
    format: PlantUMLFormat,
    diagram: string,
  ) {
    return fetch(`${baseUrl}/${format}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Accept: SUPPORTED_FORMATS[format],
      },
      body: diagram,
    });
  }
}
