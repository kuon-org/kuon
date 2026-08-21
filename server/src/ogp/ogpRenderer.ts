import { access, readFile } from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { ArticleOgpTemplate } from "./ogpTemplate.js";

const FONT_URL =
  process.env.OGP_FONT_URL ??
  "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Regular.otf";

let fontPromise: Promise<ArrayBuffer> | undefined;

const loadFont = async (): Promise<ArrayBuffer> => {
  const localPath = process.env.OGP_FONT_PATH
    ? path.resolve(process.env.OGP_FONT_PATH)
    : path.resolve(process.cwd(), "assets/fonts/NotoSansJP-Regular.otf");

  try {
    await access(localPath);
    const data = await readFile(localPath);
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    );
  } catch {
    const response = await fetch(FONT_URL);
    if (!response.ok) {
      throw new Error(`Failed to load OGP font: ${response.status}`);
    }
    return response.arrayBuffer();
  }
};

const getFont = () => {
  fontPromise ??= loadFont();
  return fontPromise;
};

const toDataUri = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load OGP avatar: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
};

export interface ArticleOgpData {
  title: string;
  userName: string;
  avatarUrl?: string;
}

export const renderArticleOgp = async ({
  title,
  userName,
  avatarUrl,
}: ArticleOgpData): Promise<Buffer> => {
  const [font, avatarSrc] = await Promise.all([
    getFont(),
    avatarUrl ? toDataUri(avatarUrl) : Promise.resolve(undefined),
  ]);

  const svg = await satori(ArticleOgpTemplate({ title, userName, avatarSrc }), {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Noto Sans JP", data: font, weight: 400, style: "normal" },
      { name: "Noto Sans JP", data: font, weight: 700, style: "normal" },
    ],
  });
  return new Resvg(svg).render().asPng();
};
