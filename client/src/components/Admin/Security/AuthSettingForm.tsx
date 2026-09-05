// src/components/admin/Auth/AuthSettingForm.tsx
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  type IdpConnectivityResult,
  useAdminQuery,
} from "../../../hooks/useAdmin";
import Loading from "../../common/Loading/Loading";
import { OIDCForm } from "./OIDCForm";
import { OAuth2TemplateForm } from "./OAuth2TemplateForm";
import { SAMLForm } from "./SAMLForm";

interface AuthSettingFormProps {
  provider_name: string;
}

export const AuthSettingForm = ({ provider_name }: AuthSettingFormProps) => {
  const { t } = useTranslation("admin");
  const {
    idpConf,
    idpConf_isLoading,
    updateIdpConf,
    toggleActive,
    testIdpConnectivity,
    testIdpConnectivity_isPending,
  } = useAdminQuery(provider_name);
  const [testResult, setTestResult] = useState<IdpConnectivityResult | null>(
    null,
  );
  const [testError, setTestError] = useState<string | null>(null);

  if (idpConf_isLoading) return <Loading />;

  const config = idpConf?.idp_configurations?.config ?? {
    issuer_host: "",
    client_id: "",
    client_secret: "",
    scope: "openid profile email",
  };
  const isActive = idpConf?.idp_configurations?.is_active ?? false;

  const handleConnectivityTest = async () => {
    setTestError(null);
    setTestResult(null);
    try {
      setTestResult(await testIdpConnectivity(provider_name));
    } catch {
      setTestError(t("security.idp.connectivity.failed"));
    }
  };

  const connectivitySection = (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          onClick={handleConnectivityTest}
          disabled={testIdpConnectivity_isPending}
        >
          {testIdpConnectivity_isPending ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              {t("security.idp.connectivity.checking")}
            </>
          ) : (
            t("security.idp.connectivity.check")
          )}
        </Button>
        <Typography variant="body2" color="text.secondary">
          {t("security.idp.connectivity.description")}
        </Typography>
      </Stack>

      {testError && <Alert severity="error">{testError}</Alert>}
      {testResult && (
        <Alert severity={testResult.success ? "success" : "warning"}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
            {testResult.success
              ? t("security.idp.connectivity.success")
              : t("security.idp.connectivity.warning")}
          </Typography>
          {testResult.checks.map((check) => (
            <Typography key={check.name} variant="body2">
              {check.success ? "✓" : "×"} {check.name}
              {check.status !== undefined ? ` (HTTP ${check.status})` : ""}
              {check.message ? ` — ${check.message}` : ""}
            </Typography>
          ))}
        </Alert>
      )}
    </Box>
  );

  if (idpConf?.readOnly) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("security.idp.readOnly")}
        </Alert>
        {connectivitySection}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("security.idp.activeState", {
            state: isActive ? t("common.enabled") : t("common.disabled"),
          })}
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            overflow: "auto",
            borderRadius: 1,
            bgcolor: "action.hover",
            fontSize: 13,
          }}
        >
          {JSON.stringify(config, null, 2)}
        </Box>
      </Box>
    );
  }

  return (
    <>
      {connectivitySection}
      {provider_name === "saml" || provider_name.startsWith("saml-") ? (
        <SAMLForm
          key={provider_name}
          provider_name={provider_name}
          initialData={config}
          isActive={isActive}
          updateIdpConf={updateIdpConf}
          toggleActive={toggleActive}
        />
      ) : provider_name === "oidc" || provider_name.startsWith("oidc-") ? (
        <OIDCForm
          key={provider_name}
          provider_name={provider_name}
          initialData={config}
          isActive={isActive}
          updateIdpConf={updateIdpConf}
          toggleActive={toggleActive}
        />
      ) : (
        <OAuth2TemplateForm
          key={provider_name}
          provider_name={provider_name}
          initialData={config}
          isActive={isActive}
          updateIdpConf={updateIdpConf}
          toggleActive={toggleActive}
        />
      )}
    </>
  );
};
