import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesRoot = path.join(clientRoot, "locales");
const sourceLocale = "ja";
const strict = process.env.KUON_I18N_STRICT === "1";

const flattenKeys = (value, prefix = "") => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key));
};

const localeNames = (await readdir(localesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (!localeNames.includes(sourceLocale)) throw new Error(`Source locale '${sourceLocale}' was not found.`);

const resources = {};
for (const locale of localeNames) {
  const files = (await readdir(path.join(localesRoot, locale)))
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml")).sort();
  resources[locale] = {};
  for (const file of files) {
    const namespace = file.replace(/\.ya?ml$/, "");
    resources[locale][namespace] = parse(await readFile(path.join(localesRoot, locale, file), "utf8")) ?? {};
  }
}

const sourceNamespaces = Object.keys(resources[sourceLocale]).sort();
for (const locale of localeNames) {
  if (locale === sourceLocale) continue;
  const namespaces = Object.keys(resources[locale]).sort();
  const problems = [];
  const missingNamespaces = sourceNamespaces.filter((namespace) => !namespaces.includes(namespace));
  const extraNamespaces = namespaces.filter((namespace) => !sourceNamespaces.includes(namespace));
  if (strict && missingNamespaces.length) problems.push(`missing namespaces: ${missingNamespaces.join(", ")}`);
  if (extraNamespaces.length) problems.push(`extra namespaces: ${extraNamespaces.join(", ")}`);
  for (const namespace of sourceNamespaces.filter((name) => namespaces.includes(name))) {
    const sourceKeys = new Set(flattenKeys(resources[sourceLocale][namespace]));
    const localeKeys = new Set(flattenKeys(resources[locale][namespace]));
    const missingKeys = [...sourceKeys].filter((key) => !localeKeys.has(key));
    const extraKeys = [...localeKeys].filter((key) => !sourceKeys.has(key));
    if (strict && missingKeys.length) problems.push(`${namespace}: missing keys: ${missingKeys.join(", ")}`);
    if (extraKeys.length) problems.push(`${namespace}: extra keys: ${extraKeys.join(", ")}`);
  }
  if (problems.length) throw new Error(`Locale '${locale}' does not match '${sourceLocale}':\n- ${problems.join("\n- ")}`);
}
console.log(`Validated locales: ${localeNames.join(", ")}`);
