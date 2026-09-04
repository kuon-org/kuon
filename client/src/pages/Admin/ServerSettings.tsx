import { useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import { useServerSettingsQuery } from "../../hooks/useAdmin";
import { SmtpSettingsSection } from "./SmtpSettingsSection";

export const ServerSettings = () => {
  const {
    settings,
    settings_isLoading,
    updateServerSetting,
    updateServerSetting_isPending,
  } = useServerSettingsQuery();
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
    try {
      await updateServerSetting({ key, value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "設定の更新に失敗しました");
    }
  };

  const updateBooleanSetting = async (key: string, enabled: boolean) =>
    updateSetting(key, String(enabled));

  const sourceAlert = (readOnly?: boolean) =>
    readOnly ? (
      <Alert severity="info" sx={{ mb: 2 }}>
        Source: Environment — 環境変数から設定されているため読み取り専用です。
      </Alert>
    ) : null;

  return (
    <Paper
      elevation={0}
      sx={{
        mx: "auto",
        p: 3,
        minWidth: { xs: "100%", md: "600px", lg: "850px" },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>アプリ設定</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Kuonインスタンス全体の運用・通知・外部連携に関する設定を管理します。
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {settings_isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Typography variant="h5" sx={{ mb: 1 }}>メンテナンスモード</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            有効にすると、一般ユーザーからのコンテンツアクセスを停止します。管理者は引き続き管理画面へアクセスして解除できます。
          </Typography>
          {sourceAlert(maintenanceSetting?.readOnly)}
          {maintenanceMode && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              現在メンテナンスモードです。一般ユーザーにはメンテナンス画面が表示されます。
            </Alert>
          )}
          <FormControlLabel
            control={<Switch checked={maintenanceMode} onChange={(event) => updateBooleanSetting("maintenance_mode", event.target.checked)} disabled={maintenanceSetting?.readOnly || updateServerSetting_isPending} />}
            label={maintenanceMode ? "有効" : "無効"}
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>アプリ内通知</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            インスタンス全体でアプリ内通知を有効にします。無効の場合、新しい通知は生成されず、TopBarの通知ベルも表示されません。
          </Typography>
          {sourceAlert(notificationsSetting?.readOnly)}
          <FormControlLabel
            control={<Switch checked={notificationsEnabled} onChange={(event) => updateBooleanSetting("notifications_enabled", event.target.checked)} disabled={notificationsSetting?.readOnly || updateServerSetting_isPending} />}
            label={notificationsEnabled ? "有効" : "無効"}
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>Webhook</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            インスタンス全体でWebhook配信を許可します。無効の場合、登録済みWebhookが有効でも外部への通知は送信されません。
          </Typography>
          {sourceAlert(webhooksSetting?.readOnly)}
          <FormControlLabel
            control={<Switch checked={webhooksEnabled} onChange={(event) => updateBooleanSetting("webhooks_enabled", event.target.checked)} disabled={webhooksSetting?.readOnly || updateServerSetting_isPending} />}
            label={webhooksEnabled ? "許可する" : "許可しない"}
          />

          <Box sx={{ mt: 2, ml: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>ユーザーWebhook</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ユーザー単位のWebhook登録・配信を許可します。外部URLへの情報送信経路になるため、必要な場合のみ有効にしてください。
            </Typography>
            {sourceAlert(allowUserWebhooksSetting?.readOnly)}
            <FormControlLabel
              control={<Switch checked={allowUserWebhooks} onChange={(event) => updateBooleanSetting("allow_user_webhooks", event.target.checked)} disabled={!webhooksEnabled || allowUserWebhooksSetting?.readOnly || updateServerSetting_isPending} />}
              label={allowUserWebhooks ? "許可する" : "許可しない"}
            />
          </Box>

          <Divider sx={{ my: 3 }} />
          <SmtpSettingsSection />
        </>
      )}
    </Paper>
  );
};
