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

  const allowApiKey = settings?.find((setting) => setting.key === "allow_api_key")?.value === "true";
  const allowLocalAccountRegistration = settings?.find((setting) => setting.key === "allow_local_account_registration")?.value !== "false";
  const requireTotpForExternalIdp = settings?.find((setting) => setting.key === "require_totp_for_external_idp")?.value === "true";
  const requireAuthentication = settings?.find((setting) => setting.key === "require_authentication")?.value === "true";
  const maintenanceMode = settings?.find((setting) => setting.key === "maintenance_mode")?.value === "true";
  const webhooksEnabled = settings?.find((setting) => setting.key === "webhooks_enabled")?.value === "true";
  const allowUserWebhooks = settings?.find((setting) => setting.key === "allow_user_webhooks")?.value === "true";
  const notificationsEnabled = settings?.find((setting) => setting.key === "notifications_enabled")?.value !== "false";

  const updateBooleanSetting = async (key: string, enabled: boolean) => {
    setError(null);
    try {
      await updateServerSetting({ key, value: String(enabled) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "設定の更新に失敗しました");
    }
  };

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
      <Typography variant="h4" sx={{ mb: 3 }}>サーバ設定</Typography>
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
            有効にすると、一般ユーザーからのコンテンツアクセスを停止します。管理者は引き続きサーバ設定へアクセスしてメンテナンスモードを解除できます。
          </Typography>
          {maintenanceMode && <Alert severity="warning" sx={{ mb: 2 }}>現在メンテナンスモードです。一般ユーザーにはメンテナンス画面が表示されます。</Alert>}
          <FormControlLabel control={<Switch checked={maintenanceMode} onChange={(event) => updateBooleanSetting("maintenance_mode", event.target.checked)} disabled={updateServerSetting_isPending} />} label={maintenanceMode ? "有効" : "無効"} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>ログイン必須</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            有効にすると、未ログインユーザーによる記事・タグ・ユーザー情報などの閲覧を禁止し、ログイン画面へ誘導します。ログインや外部IdP認証に必要なエンドポイントは引き続き利用できます。
          </Typography>
          <FormControlLabel control={<Switch checked={requireAuthentication} onChange={(event) => updateBooleanSetting("require_authentication", event.target.checked)} disabled={updateServerSetting_isPending} />} label={requireAuthentication ? "要求する" : "要求しない"} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>ローカルアカウントの新規登録</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            無効にすると、新しいローカルアカウントを作成できなくなります。既存のローカルアカウントによるログインや、OIDC / OAuth2 / SAML等の外部IdP認証には影響しません。
          </Typography>
          {!allowLocalAccountRegistration && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              新しいユーザーは外部IdP経由でのみ作成できます。外部IdPが正常に利用できることを確認してください。なお、ユーザーが1人も存在しない初期セットアップ時は、この設定に関係なく登録できます。
            </Alert>
          )}
          <FormControlLabel control={<Switch checked={allowLocalAccountRegistration} onChange={(event) => updateBooleanSetting("allow_local_account_registration", event.target.checked)} disabled={updateServerSetting_isPending} />} label={allowLocalAccountRegistration ? "許可する" : "許可しない"} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>アプリ内通知</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            インスタンス全体でアプリ内通知を有効にします。無効の場合、新しい通知は生成されず、TopBarの通知ベルも表示されません。
          </Typography>
          <FormControlLabel control={<Switch checked={notificationsEnabled} onChange={(event) => updateBooleanSetting("notifications_enabled", event.target.checked)} disabled={updateServerSetting_isPending} />} label={notificationsEnabled ? "有効" : "無効"} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>Webhook</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            インスタンス全体でWebhook配信を許可します。無効の場合、登録済みWebhookが有効でも外部への通知は送信されません。
          </Typography>
          <FormControlLabel control={<Switch checked={webhooksEnabled} onChange={(event) => updateBooleanSetting("webhooks_enabled", event.target.checked)} disabled={updateServerSetting_isPending} />} label={webhooksEnabled ? "許可する" : "許可しない"} />

          <Box sx={{ mt: 2, ml: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>ユーザーWebhook</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ユーザー単位のWebhook登録・配信を許可します。外部URLへの情報送信経路になるため、必要な場合のみ有効にしてください。
            </Typography>
            <FormControlLabel control={<Switch checked={allowUserWebhooks} onChange={(event) => updateBooleanSetting("allow_user_webhooks", event.target.checked)} disabled={!webhooksEnabled || updateServerSetting_isPending} />} label={allowUserWebhooks ? "許可する" : "許可しない"} />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>API Key</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            API Keyの発行と、発行済みAPI Keyによる認証を許可します。
          </Typography>
          <FormControlLabel control={<Switch checked={allowApiKey} onChange={(event) => updateBooleanSetting("allow_api_key", event.target.checked)} disabled={updateServerSetting_isPending} />} label={allowApiKey ? "許可する" : "許可しない"} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>外部IdPログイン時の二段階認証</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            OIDC / OAuth2 / SAMLで認証した場合でも、Kuon側でTOTPを有効にしているユーザーには追加の二段階認証を要求します。TOTP未設定ユーザーへの設定強制は行いません。
          </Typography>
          <FormControlLabel control={<Switch checked={requireTotpForExternalIdp} onChange={(event) => updateBooleanSetting("require_totp_for_external_idp", event.target.checked)} disabled={updateServerSetting_isPending} />} label={requireTotpForExternalIdp ? "要求する" : "要求しない"} />

          <Divider sx={{ my: 3 }} />
          <SmtpSettingsSection />
        </>
      )}
    </Paper>
  );
};
