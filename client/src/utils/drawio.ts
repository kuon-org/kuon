import { deflateRaw, inflateRaw } from "pako";

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

/**
 * Encodes a Draw.io mxGraphModel XML into the standard compressed diagram payload.
 *
 * mxGraphModel XML -> encodeURIComponent -> Deflate Raw -> Base64
 */
export const encodeDrawio = (xml: string) => {
  const encoded = encodeURIComponent(xml);
  return toBase64(deflateRaw(encoded));
};

/**
 * Decodes a standard Draw.io compressed diagram payload back into mxGraphModel XML.
 *
 * Base64 -> Inflate Raw -> decodeURIComponent -> mxGraphModel XML
 */
export const decodeDrawio = (value: string) => {
  const compressed = fromBase64(value.trim().replace(/\s/g, ""));
  const encoded = inflateRaw(compressed, { to: "string" });
  return decodeURIComponent(encoded);
};

/**
 * Wraps a compressed mxGraphModel payload in an mxfile envelope accepted by Draw.io.
 */
export const createDrawioLoadXml = (compressedData: string) =>
  `<mxfile><diagram name="Page-1">${compressedData}</diagram></mxfile>`;
