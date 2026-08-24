export const ServerSettingKey = {
  AllowApiKey: "allow_api_key",
  RequireTotpForExternalIdp: "require_totp_for_external_idp",
} as const;

export type ServerSettingKey =
  (typeof ServerSettingKey)[keyof typeof ServerSettingKey];
