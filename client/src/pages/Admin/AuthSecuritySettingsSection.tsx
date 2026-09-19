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
import {
  useServerSettingsQuery,
  useUpdateServerSetting,
} from "../../hooks/admin";
import { useTranslation } from "react-i18next";

export const AuthSecuritySettingsSection = () => {
  const { t } = useTranslation("admin");
  const settingsQuery = useServerSettingsQuery();
  const updateServerSetting = useUpdateServerSetting();
  const settings = settingsQuery.data;
  const [error, setError] = useState<string | null>(null);
  const getSetting = (key: string) =>
    settings?.find((setting) => setting.key === key);
  const localRegistrationSetting = getSetting(
    "allow_local_account_registration",
  );
  const emailVerificationSetting = getSetting("email_verification_policy");
  const externalTotpSetting = getSetting("require_totp_for_external_idp");
  const authenticationSetting = getSetting("require_authentication");
  const apiKeySetting = getSetting("allow_api_key");
  const allowLocalAccountRegistration =
    localRegistrationSetting?.value !== "false";
  const emailVerificationRequired =
    emailVerificationSetting?.value === "required";
  const requireTotpForExternalIdp = externalTotpSetting?.value === "true";
  const requireAuthentication = authenticationSetting?.value === "true";
  const allowApiKey = apiKeySetting?.value === "true";
  const updateSetting = async (key: string, value: string) => {
    setError(null);
    try {
      await updateServerSetting.mutateAsync({ key, value });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("serverSettings.updateFailed"),
      );
    }
  };
  const updateBooleanSetting = async (key: string, enabled: boolean) =>
    updateSetting(key, String(enabled));
  const sourceAlert = (readOnly?: boolean) =>
    readOnly ? (
      <Alert severity="info" sx={{ mb: 2 }}>
        {t("serverSettings.envReadOnly")}
      </Alert>
    ) : null;
  if (settingsQuery.isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Typography variant="h5" sx={{ mb: 1 }}>
        {t("security.accessControl.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("security.accessControl.description")}
      </Typography>
      {sourceAlert(authenticationSetting?.readOnly)}
      <FormControlLabel
        control={
          <Switch
            checked={requireAuthentication}
            onChange={(e) =>
              updateBooleanSetting("require_authentication", e.target.checked)
            }
            disabled={
              authenticationSetting?.readOnly || updateServerSetting.isPending
            }
          />
        }
        label={
          requireAuthentication
            ? t("security.accessControl.requireLogin")
            : t("security.accessControl.allowPublic")
        }
      />
      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" sx={{ mb: 1 }}>
        {t("security.localAccount.title")}
      </Typography>
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 0.5 }}>
        {t("security.localAccount.registrationTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("security.localAccount.registrationDescription")}
      </Typography>
      {sourceAlert(localRegistrationSetting?.readOnly)}
      {!allowLocalAccountRegistration && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t("security.localAccount.disabledWarning")}
        </Alert>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={allowLocalAccountRegistration}
            onChange={(e) =>
              updateBooleanSetting(
                "allow_local_account_registration",
                e.target.checked,
              )
            }
            disabled={
              localRegistrationSetting?.readOnly ||
              updateServerSetting.isPending
            }
          />
        }
        label={
          allowLocalAccountRegistration
            ? t("common.allowed")
            : t("common.notAllowed")
        }
      />
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 0.5 }}>
        {t("security.localAccount.verificationTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("security.localAccount.verificationDescription")}
      </Typography>
      {sourceAlert(emailVerificationSetting?.readOnly)}
      {emailVerificationRequired && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("security.localAccount.verificationRequired")}
        </Alert>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={emailVerificationRequired}
            onChange={(e) =>
              updateSetting(
                "email_verification_policy",
                e.target.checked ? "required" : "disabled",
              )
            }
            disabled={
              emailVerificationSetting?.readOnly ||
              updateServerSetting.isPending
            }
          />
        }
        label={emailVerificationRequired ? "Required" : "Disabled"}
      />
      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" sx={{ mb: 1 }}>
        {t("security.twoFactor.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("security.twoFactor.description")}
      </Typography>
      {sourceAlert(externalTotpSetting?.readOnly)}
      <FormControlLabel
        control={
          <Switch
            checked={requireTotpForExternalIdp}
            onChange={(e) =>
              updateBooleanSetting(
                "require_totp_for_external_idp",
                e.target.checked,
              )
            }
            disabled={
              externalTotpSetting?.readOnly || updateServerSetting.isPending
            }
          />
        }
        label={
          requireTotpForExternalIdp
            ? t("security.twoFactor.require")
            : t("security.twoFactor.notRequire")
        }
      />
      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" sx={{ mb: 1 }}>
        {t("security.apiKey.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("security.apiKey.description")}
      </Typography>
      {sourceAlert(apiKeySetting?.readOnly)}
      <FormControlLabel
        control={
          <Switch
            checked={allowApiKey}
            onChange={(e) =>
              updateBooleanSetting("allow_api_key", e.target.checked)
            }
            disabled={apiKeySetting?.readOnly || updateServerSetting.isPending}
          />
        }
        label={allowApiKey ? t("common.allowed") : t("common.notAllowed")}
      />
    </>
  );
};
