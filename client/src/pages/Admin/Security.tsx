import { Divider, Paper, Typography } from "@mui/material";
import { AuthSettings } from "../../components/Admin/Security/AuthSettings";
import { AuthSecuritySettingsSection } from "./AuthSecuritySettingsSection";
import { useTranslation } from "react-i18next";

export const Security = () => {
  const { t } = useTranslation("admin");
  return <Paper elevation={0} sx={{ mx: "auto", p: 3, minWidth: { xs: "100%", md: "600px", lg: "850px" }, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
    <Typography variant="h4" sx={{ mb: 1 }}>{t("security.title")}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t("security.description")}</Typography>
    <AuthSecuritySettingsSection />
    <Divider sx={{ my: 4 }} />
    <Typography variant="h5" sx={{ mb: 2 }}>{t("security.identityProviders")}</Typography>
    <AuthSettings />
  </Paper>;
};
