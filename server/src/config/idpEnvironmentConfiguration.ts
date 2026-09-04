import { readGroupedEnvironmentConfiguration } from "./environmentConfiguration.js";

const IDP_METADATA_FIELDS = new Set([
  "PROVIDER_NAME",
  "DISPLAY_NAME",
  "PROVIDER_TYPE",
  "DESCRIPTION",
  "LOGO_URL",
  "BUTTON_COLOR",
  "TEXT_COLOR",
  "IS_ACTIVE",
]);

const SECRET_FIELD_PATTERN = /(?:SECRET|PASSWORD|TOKEN|CERT)$/i;

export type EnvironmentIdp = {
  key: string;
  provider_name: string;
  display_name: string;
  provider_type: string;
  description?: string;
  logo_url?: string;
  button_color?: string;
  text_color?: string;
  is_active: boolean;
  config: Record<string, unknown>;
};

const parseJsonField = (name: string, value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${name} must contain valid JSON`);
  }
};

const buildConfig = (
  key: string,
  fields: Record<string, string>,
): Record<string, unknown> => {
  const config: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(fields)) {
    if (IDP_METADATA_FIELDS.has(field)) continue;
    const configKey = field.toLowerCase();
    config[configKey] = field === "MAPPING" ? parseJsonField(`KUON_IDP__${key}__MAPPING`, value) : value;
  }

  return config;
};

export const getEnvironmentIdps = (): EnvironmentIdp[] => {
  const grouped = readGroupedEnvironmentConfiguration("KUON_IDP");

  return Object.entries(grouped).map(([key, fields]) => ({
    key,
    provider_name: fields.PROVIDER_NAME || key,
    display_name: fields.DISPLAY_NAME || fields.PROVIDER_NAME || key,
    provider_type: (fields.PROVIDER_TYPE || "OIDC").toUpperCase(),
    description: fields.DESCRIPTION,
    logo_url: fields.LOGO_URL,
    button_color: fields.BUTTON_COLOR,
    text_color: fields.TEXT_COLOR,
    is_active: fields.IS_ACTIVE !== "false",
    config: buildConfig(key, fields),
  }));
};

export const getEnvironmentIdp = (
  providerName: string,
): EnvironmentIdp | undefined =>
  getEnvironmentIdps().find((provider) => provider.provider_name === providerName);

export const sanitizeIdpConfig = (
  config: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      SECRET_FIELD_PATTERN.test(key) && value ? "[REDACTED]" : value,
    ]),
  );
