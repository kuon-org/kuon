import { useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { useServerSettingsQuery } from "../../hooks/useAdmin";

export const AuthSecuritySettingsSection = () => {
  const {
    settings,
    settings_isLoading,
    updateServerSetting,
    updateServerSetting_isPending,
  } = useServerSettingsQuery();
  const [error, setError] = useState<string | null>(null);

  const getSetting = (key: string) => settings?.find((setting) => setting.key === key);
  const localRegistrationSetting = getSetting("allow_local_account_registration");
  const emailVerificationSetting = getSetting("email_verification_policy");
  const externalTotpSetting = getSetting("require_totp_for_external_idp");
  const authenticationSetting = getSetting("require_authentication");
  const apiKeySetting = getSetting("allow_api_key");

  const allowLocalAccountRegistration = localRegistrationSetting?.value !== "false";
  const emailVerificationRequired = emailVerificationSetting?.value === "required";
  const requireTotpForExternalIdp = externalTotpSetting?.value === "true";
  const requireAuthentication = authenticationSetting?.value === "true";
  const allowApiKey = apiKeySetting?.value === "true";

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

  if (settings_isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h5" sx={{ mb: 1 }}>アクセス制御</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        未ログインユーザーによる記事・タグ・ユーザー情報などの閲覧を制御します。
      </Typography>
      {sourceAlert(authenticationSetting?.readOnly)}
      <FormControlLabel
        control={<Switch checked={requireAuthentication} onChange={(event) => updateBooleanSetting("require_authentication", event.target.checked)} disabled={authenticationSetting?.readOnly || updateServerSetting_isPending} />}
        label={requireAuthentication ? "ログインを要求する" : "公開アクセスを許可する"}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" sx={{ mb: 1 }}>ID / Password</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 0.5 }}>ローカルアカウントの新規登録</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        無効にすると、新しいローカルアカウントを作成できなくなります。既存アカウントのログインや外部IdP認証には影響しません。
      </Typography>
      {sourceAlert(localRegistrationSetting?.readOnly)}
      {!allowLocalAccountRegistration && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          新しいユーザーは外部IdP経由でのみ作成できます。ユーザーが1人も存在しない初期セットアップ時は、この設定に関係なく登録できます。
        </Alert>
      )}
      <FormControlLabel
        control={<Switch checked={allowLocalAccountRegistration} onChange={(event) => updateBooleanSetting("allow_local_account_registration", event.target.checked)} disabled={localRegistrationSetting?.readOnly || updateServerSetting_isPending} />}
        label={allowLocalAccountRegistration ? "許可する" : "許可しない"}
      />

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 0.5 }}>Email Verification</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Requiredにすると、新しく作成したローカルアカウントは確認メールのURLを開くまでログインできません。
      </Typography>
      {sourceAlert(emailVerificationSetting?.readOnly)}
      {emailVerificationRequired && (
        <Alert severity="info" sx={{ mb: 2 }}>
          現在Requiredです。確認メールの送信にはアプリ設定内のSMTP設定を利用します。
        </Alert>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={emailVerificationRequired}
            onChange={(event) => updateSetting("email_verification_policy", event.target.checked ? "required" : "disabled")}
            disabled={emailVerificationSetting?.readOnly || updateServerSetting_isPending}
          />
        }
        label={emailVerificationRequired ? "Required" : "Disabled"}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" sx={{ mb: 1 }}>2FA / Security Policy</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        OIDC / OAuth2 / SAMLで認証した場合でも、Kuon側でTOTPを有効にしているユーザーへ追加の二段階認証を要求できます。
      </Typography>
      {sourceAlert(externalTotpSetting?.readOnly)}
      <FormControlLabel
        control={<Switch checked={requireTotpForExternalIdp} onChange={(event) => updateBooleanSetting("require_totp_for_external_idp", event.target.checked)} disabled={externalTotpSetting?.readOnly || updateServerSetting_isPending} />}
        label={requireTotpForExternalIdp ? "要求する" : "要求しない"}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" sx={{ mb: 1 }}>API Key</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        API Keyの発行と、発行済みAPI Keyによる認証を許可します。
      </Typography>
      {sourceAlert(apiKeySetting?.readOnly)}
      <FormControlLabel
        control={<Switch checked={allowApiKey} onChange={(event) => updateBooleanSetting("allow_api_key", event.target.checked)} disabled={apiKeySetting?.readOnly || updateServerSetting_isPending} />}
        label={allowApiKey ? "許可する" : "許可しない"}
      />
    </>
  );
};
