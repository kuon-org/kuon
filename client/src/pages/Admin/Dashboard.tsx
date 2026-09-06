import { Box, Chip, Divider, Paper, Typography } from "@mui/material";
import { useAdminStatusQuery, useServerSettingsQuery } from "../../hooks/useAdmin";
import { useMyPermissionsQuery } from "../../hooks/roles";
import { useTranslation } from "react-i18next";

const getBooleanSetting = (settings: { key: string; value: string }[] | undefined, key: string, defaultValue = false) => {
  const value = settings?.find((setting) => setting.key === key)?.value;
  if (value === undefined) return defaultValue;
  return value === "true";
};

interface StatusCardProps {
  title: string;
  description: string;
  enabled: boolean;
  enabledLabel: string;
  disabledLabel: string;
  warningWhenEnabled?: boolean;
}

const StatusCard = ({ title, description, enabled, enabledLabel, disabledLabel, warningWhenEnabled = false }: StatusCardProps) => (
  <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2, minHeight: 150 }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
      <Typography variant="h6">{title}</Typography>
      <Chip size="small" label={enabled ? enabledLabel : disabledLabel} color={warningWhenEnabled && enabled ? "warning" : enabled ? "success" : "default"} variant={enabled ? "filled" : "outlined"} />
    </Box>
    <Typography variant="body2" color="text.secondary">{description}</Typography>
  </Paper>
);

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const Dashboard = () => {
  const { t } = useTranslation("admin");
  const permissionsQuery = useMyPermissionsQuery();
  const permissions = permissionsQuery.data?.permissions ?? [];
  const canReadSystemStatus = permissions.includes("system.settings.manage");
  const { settings, settings_isLoading } = useServerSettingsQuery(canReadSystemStatus);
  const { status, status_isLoading, status_isError } = useAdminStatusQuery(canReadSystemStatus);
  const maintenanceMode = getBooleanSetting(settings, "maintenance_mode");
  const requireAuthentication = getBooleanSetting(settings, "require_authentication");
  const notificationsEnabled = getBooleanSetting(settings, "notifications_enabled", true);
  const webhooksEnabled = getBooleanSetting(settings, "webhooks_enabled");
  const allowLocalAccountRegistration = getBooleanSetting(settings, "allow_local_account_registration", true);

  return (
    <Box sx={{ width: "100%", maxWidth: 980 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>{t("dashboard.title")}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{t("dashboard.description")}</Typography>
      {!canReadSystemStatus && (
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t("dashboard.consoleTitle")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("dashboard.consoleDescription")}</Typography>
        </Paper>
      )}
      {canReadSystemStatus && (
        <>
          {settings_isLoading ? <Typography color="text.secondary">{t("dashboard.fetchingStatus")}</Typography> : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
              <StatusCard title={t("dashboard.maintenance.title")} description={t("dashboard.maintenance.description")} enabled={maintenanceMode} enabledLabel={t("dashboard.maintenance.enabled")} disabledLabel={t("dashboard.maintenance.disabled")} warningWhenEnabled />
              <StatusCard title={t("dashboard.authentication.title")} description={t("dashboard.authentication.description")} enabled={requireAuthentication} enabledLabel={t("dashboard.authentication.enabled")} disabledLabel={t("dashboard.authentication.disabled")} />
              <StatusCard title={t("dashboard.localRegistration.title")} description={t("dashboard.localRegistration.description")} enabled={allowLocalAccountRegistration} enabledLabel={t("dashboard.localRegistration.enabled")} disabledLabel={t("dashboard.localRegistration.disabled")} />
              <StatusCard title={t("dashboard.notifications.title")} description={t("dashboard.notifications.description")} enabled={notificationsEnabled} enabledLabel={t("common.enabled")} disabledLabel={t("common.disabled")} />
              <StatusCard title={t("dashboard.webhooks.title")} description={t("dashboard.webhooks.description")} enabled={webhooksEnabled} enabledLabel={t("common.enabled")} disabledLabel={t("common.disabled")} />
            </Box>
          )}
          <Paper elevation={0} sx={{ mt: 3, p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{t("dashboard.runtime.title")}</Typography>
            {status_isLoading && <Typography color="text.secondary">{t("dashboard.runtime.loading")}</Typography>}
            {status_isError && <Typography color="error">{t("dashboard.runtime.loadFailed")}</Typography>}
            {status && (
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                  <Box><Typography variant="caption" color="text.secondary">{t("dashboard.runtime.uptime")}</Typography><Typography>{formatUptime(status.uptimeSeconds)}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Node.js</Typography><Typography>{status.nodeVersion}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">{t("dashboard.runtime.database")}</Typography><Typography>{status.database.status === "connected" ? t("dashboard.runtime.connected") : t("dashboard.runtime.error")}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">PostgreSQL</Typography><Typography sx={{ wordBreak: "break-word" }}>{status.database.postgresVersion ?? t("dashboard.runtime.unknown")}</Typography></Box>
                </Box>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="subtitle1" sx={{ mb: 1.5 }}>{t("dashboard.runtime.environmentVariables")}</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {status.environment.map((item) => (
                    <Box key={item.key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                      <Box><Typography component="span" sx={{ fontFamily: "monospace" }}>{item.key}</Typography><Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>{t("dashboard.runtime.sourceLabel")}</Typography></Box>
                      <Chip size="small" label={item.configured ? t("common.configured") : t("common.notConfigured")} color={item.configured ? "success" : "default"} variant={item.configured ? "filled" : "outlined"} />
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};
