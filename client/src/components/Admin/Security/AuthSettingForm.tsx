// src/components/admin/Auth/AuthSettingForm.tsx
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

  // DBからのデータを取得、なければデフォルト値
  const config = idpConf?.idp_configurations?.config ?? {
    issuer_host: "",
    client_id: "",
    client_secret: "",
    scope: "openid profile email",
  };
  const isActive = idpConf?.idp_configurations?.is_active ?? false;
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
  // OIDC（oidc単体 または oidc-接頭辞）の場合
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

  // OAuth2（discord, github等）の場合
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
