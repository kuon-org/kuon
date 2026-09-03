export const ServerSettingKey = {
  AllowApiKey: "allow_api_key",
  AllowLocalAccountRegistration: "allow_local_account_registration",
  RequireTotpForExternalIdp: "require_totp_for_external_idp",
  RequireAuthentication: "require_authentication",
  MaintenanceMode: "maintenance_mode",
  WebhooksEnabled: "webhooks_enabled",
  AllowUserWebhooks: "allow_user_webhooks",
  NotificationsEnabled: "notifications_enabled",
} as const;

export type ServerSettingKey =
  (typeof ServerSettingKey)[keyof typeof ServerSettingKey];
