import { useState } from "react";
import { Alert, Box, CircularProgress, Divider, FormControlLabel, Paper, Switch, Typography } from "@mui/material";
import { useServerSettingsQuery, useUpdateServerSetting } from "../../hooks/admin";
import { SmtpSettingsSection } from "./SmtpSettingsSection";
import { StorageSettingsSection } from "./StorageSettingsSection";
import { useTranslation } from "react-i18next";

export const ServerSettings = () => {
  const { t } = useTranslation("admin");
  const settingsQuery = useServerSettingsQuery();
  const updateServerSetting = useUpdateServerSetting();
  const settings = settingsQuery.data;
  const [error, setError] = useState<string | null>(null);
  const getSetting = (key: string) => settings?.find((setting) => setting.key === key);
  const maintenanceSetting = getSetting("maintenance_mode");
  const webhooksSetting = getSetting("webhooks_enabled");
  const allowUserWebhooksSetting = getSetting("allow_user_webhooks");
  const notificationsSetting = getSetting("notifications_enabled");
  const maintenanceMode = maintenanceSetting?.value === "true";
  const webhooksEnabled = webhooksSetting?.value === "true";
  const allowUserWebhooks = allowUserWebhooksSetting?.value === "true";
  const notificationsEnabled = notificationsSetting?.value !== "false";

  const updateSetting = async (key: string, value: string) => {
    setError(null);
    try { await updateServerSetting.mutateAsync({ key, value }); }
    catch (e) { setError(e instanceof Error ? e.message : t("serverSettings.updateFailed")); }
  };
  const updateBooleanSetting = async (key: string, enabled: boolean) => updateSetting(key, String(enabled));
  const sourceAlert = (readOnly?: boolean) => readOnly ? <Alert severity="info" sx={{ mb: 2 }}>{t("serverSettings.envReadOnly")}</Alert> : null;

  return (
    <Paper elevation={0} sx={{ mx: "auto", p: 3, minWidth: { xs: "100%", md: "600px", lg: "850px" }, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>{t("serverSettings.title")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t("serverSettings.description")}</Typography>
      <Divider sx={{ mb: 3 }} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {settingsQuery.isLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box> : (
        <>
          <Typography variant="h5" sx={{ mb: 1 }}>{t("serverSettings.maintenance.title")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("serverSettings.maintenance.description")}</Typography>
          {sourceAlert(maintenanceSetting?.readOnly)}
          {maintenanceMode && <Alert severity="warning" sx={{ mb: 2 }}>{t("serverSettings.maintenance.warning")}</Alert>}
          <FormControlLabel control={<Switch checked={maintenanceMode} onChange={(event) => updateBooleanSetting("maintenance_mode", event.target.checked)} disabled={maintenanceSetting?.readOnly || updateServerSetting.isPending} />} label={maintenanceMode ? t("common.enabled") : t("common.disabled")} />
          <Divider sx={{ my: 3 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>{t("serverSettings.notifications.title")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("serverSettings.notifications.description")}</Typography>
          {sourceAlert(notificationsSetting?.readOnly)}
          <FormControlLabel control={<Switch checked={notificationsEnabled} onChange={(event) => updateBooleanSetting("notifications_enabled", event.target.checked)} disabled={notificationsSetting?.readOnly || updateServerSetting.isPending} />} label={notificationsEnabled ? t("common.enabled") : t("common.disabled")} />
          <Divider sx={{ my: 3 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>{t("serverSettings.webhooks.title")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("serverSettings.webhooks.description")}</Typography>
          {sourceAlert(webhooksSetting?.readOnly)}
          <FormControlLabel control={<Switch checked={webhooksEnabled} onChange={(event) => updateBooleanSetting("webhooks_enabled", event.target.checked)} disabled={webhooksSetting?.readOnly || updateServerSetting.isPending} />} label={webhooksEnabled ? t("common.allowed") : t("common.notAllowed")} />
          <Box sx={{ mt: 2, ml: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{t("serverSettings.webhooks.userTitle")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t("serverSettings.webhooks.userDescription")}</Typography>
            {sourceAlert(allowUserWebhooksSetting?.readOnly)}
            <FormControlLabel control={<Switch checked={allowUserWebhooks} onChange={(event) => updateBooleanSetting("allow_user_webhooks", event.target.checked)} disabled={!webhooksEnabled || allowUserWebhooksSetting?.readOnly || updateServerSetting.isPending} />} label={allowUserWebhooks ? t("common.allowed") : t("common.notAllowed")} />
          </Box>
          <Divider sx={{ my: 3 }} />
          <StorageSettingsSection />
          <Divider sx={{ my: 3 }} />
          <SmtpSettingsSection />
        </>
      )}
    </Paper>
  );
};
