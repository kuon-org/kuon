import { useAdminQuery } from "../../../hooks/useAdmin";
import Loading from "../../common/Loading/Loading";
import { TemplateForm } from "./TemplateForm";

interface AuthSettingFormProps {
    provider_name: string;
}

export const AuthSettingForm = ({provider_name}: AuthSettingFormProps) => {
    const { idpConf, idpConf_isLoading, updateIdpConf, toggleActive } = useAdminQuery(provider_name);

    // 1. ロード中は Loading を出す（Presenter はまだマウントされない）
    if (idpConf_isLoading) return <Loading />;

    // 2. データが空だった場合のフォールバック
    const config = idpConf?.idp_configurations?.config ?? { client_id: "", client_secret: "", redirect_uri: "" };
    const isActive = idpConf?.idp_configurations?.is_active ?? false;

    return (
        <TemplateForm
            key={provider_name}
            provider_name={provider_name}
            initialData={config}
            isActive={isActive}
            updateIdpConf={updateIdpConf}
            toggleActive={toggleActive}
        />
    );
}