// src/components/admin/Auth/AuthSettingForm.tsx
import { Alert, Box, Typography } from "@mui/material";
import { useAdminQuery } from "../../../hooks/useAdmin";
import Loading from "../../common/Loading/Loading";
import { OIDCForm } from "./OIDCForm";
import { OAuth2TemplateForm } from "./OAuth2TemplateForm";
import { SAMLForm } from "./SAMLForm";

interface AuthSettingFormProps {
  provider_name: string;
}

export const AuthSettingForm = ({ provider_name }: AuthSettingFormProps) => {
  const { idpConf, idpConf_isLoading, updateIdpConf, toggleActive } =
    useAdminQuery(provider_name);

  if (idpConf_isLoading) return <Loading />;

  const config = idpConf?.idp_configurations?.config ?? {
    issuer_host: "",
    client_id: "",
    client_secret: "",
    scope: "openid profile email",
  };
  const isActive = idpConf?.idp_configurations?.is_active ?? false;

  if (idpConf?.readOnly) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Source: Environment — このIdentity Providerは環境変数から設定されているため読み取り専用です。
        </Alert>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          有効状態: {isActive ? "有効" : "無効"}
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

  if (provider_name === "saml" || provider_name.startsWith("saml-")) {
    return (
      <SAMLForm
        key={provider_name}
        provider_name={provider_name}
        initialData={config}
        isActive={isActive}
        updateIdpConf={updateIdpConf}
        toggleActive={toggleActive}
      />
    );
  }
  if (provider_name === "oidc" || provider_name.startsWith("oidc-")) {
    return (
      <OIDCForm
        key={provider_name}
        provider_name={provider_name}
        initialData={config}
        isActive={isActive}
        updateIdpConf={updateIdpConf}
        toggleActive={toggleActive}
      />
    );
  }

  return (
    <OAuth2TemplateForm
      key={provider_name}
      provider_name={provider_name}
      initialData={config}
      isActive={isActive}
      updateIdpConf={updateIdpConf}
      toggleActive={toggleActive}
    />
  );
};
