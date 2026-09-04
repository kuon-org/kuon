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
  "CONFIG_JSON",
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

const parseJsonObject = (
  name: string,
  value: string,
): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${name} must contain a valid JSON object`);
  }
};

const buildConfig = (
  key: string,
  providerName: string,
  fields: Record<string, string>,
): Record<string, unknown> => {
  const config = fields.CONFIG_JSON
    ? parseJsonObject(`KUON_IDP__${key}__CONFIG_JSON`, fields.CONFIG_JSON)
    : {};

  for (const [field, value] of Object.entries(fields)) {
    if (IDP_METADATA_FIELDS.has(field)) continue;
    const configKey = field.toLowerCase();
    config[configKey] =
      field === "MAPPING"
        ? parseJsonObject(`KUON_IDP__${key}__MAPPING`, value)
        : value;
  }

  if (!config.redirect_uri) {
    const baseUrl =
      process.env.APP_SITE_URL ??
      process.env.BACKEND_URL ??
      "http://localhost:3000";
    config.redirect_uri = `${baseUrl.replace(/\/$/, "")}/auth/${providerName}/callback`;
  }

  return config;
};

export const getEnvironmentIdps = (): EnvironmentIdp[] => {
  const grouped = readGroupedEnvironmentConfiguration("KUON_IDP");

  return Object.entries(grouped).map(([key, fields]) => {
    if (fields.IS_ACTIVE !== undefined && !["true", "false"].includes(fields.IS_ACTIVE)) {
      throw new Error(`KUON_IDP__${key}__IS_ACTIVE must be true or false`);
    }

    const providerName = fields.PROVIDER_NAME || key;

    return {
      key,
      provider_name: providerName,
      display_name: fields.DISPLAY_NAME || providerName,
      provider_type: (fields.PROVIDER_TYPE || "OIDC").toUpperCase(),
      description: fields.DESCRIPTION,
      logo_url: fields.LOGO_URL,
      button_color: fields.BUTTON_COLOR,
      text_color: fields.TEXT_COLOR,
      is_active: fields.IS_ACTIVE !== "false",
      config: buildConfig(key, providerName, fields),
    };
  });
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
