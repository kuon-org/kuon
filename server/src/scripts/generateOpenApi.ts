import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { swaggerSpec } from "../swagger.js";

const outputPath = fileURLToPath(
  new URL("../../generated/openapi.json", import.meta.url),
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(swaggerSpec, null, 2)}\n`,
  "utf8",
);

console.log(`OpenAPI document generated: ${outputPath}`);
