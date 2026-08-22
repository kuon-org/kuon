export const ServerSettingKey = {
  AllowApiKey: "allow_api_key",
} as const;

export type ServerSettingKey =
  (typeof ServerSettingKey)[keyof typeof ServerSettingKey];
