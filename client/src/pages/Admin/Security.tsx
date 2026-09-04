import { Divider, Paper, Typography } from "@mui/material";
import { AuthSettings } from "../../components/Admin/Security/AuthSettings";
import { AuthSecuritySettingsSection } from "./AuthSecuritySettingsSection";

export const Security = () => {
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
      <Typography variant="h4" sx={{ mb: 1 }}>認証・セキュリティ</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ローカル認証、外部Identity Provider、2FAなど認証に関する設定を管理します。
      </Typography>

      <AuthSecuritySettingsSection />

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" sx={{ mb: 2 }}>Identity Providers</Typography>
      <AuthSettings />
    </Paper>
  );
};
