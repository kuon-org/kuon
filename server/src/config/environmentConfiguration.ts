export type ConfigurationSource = "environment" | "database";

export type GroupedEnvironmentConfiguration = Record<
  string,
  Record<string, string>
>;

export const readGroupedEnvironmentConfiguration = (
  prefix: string,
  env: NodeJS.ProcessEnv = process.env,
): GroupedEnvironmentConfiguration => {
  const grouped: GroupedEnvironmentConfiguration = {};
  const marker = `${prefix}__`;

  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith(marker) || value === undefined) continue;

    const remainder = name.slice(marker.length);
    const separatorIndex = remainder.indexOf("__");
    if (separatorIndex <= 0) continue;

    const key = remainder.slice(0, separatorIndex);
    const field = remainder.slice(separatorIndex + 2);
    if (!field || !/^[A-Z0-9_]+$/.test(field)) continue;

    grouped[key] ??= {};
    grouped[key][field] = value;
  }

  return grouped;
};

export const readBooleanEnvironmentValue = (
  name: string,
  value: string | undefined,
): boolean | undefined => {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
};

export const readIntegerEnvironmentValue = (
  name: string,
  value: string | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${name} must be an integer`);
  }
  return parsed;
};
