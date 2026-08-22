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

export const ServerSettings = () => {
  const { settings, settings_isLoading, updateServerSetting, updateServerSetting_isPending } =
    useServerSettingsQuery();
  const [error, setError] = useState<string | null>(null);

  const allowApiKey = settings?.find((setting) => setting.key === "allow_api_key")?.value === "true";

  const handleApiKeyChange = async (enabled: boolean) => {
    setError(null);
    try {
      await updateServerSetting({
        key: "allow_api_key",
        value: String(enabled),
      });
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
      <Typography variant="h4" sx={{ mb: 3 }}>
        サーバ設定
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Typography variant="h5" sx={{ mb: 1 }}>
        API Key
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        API Keyの発行と、発行済みAPI Keyによる認証を許可します。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {settings_isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <FormControlLabel
          control={
            <Switch
              checked={allowApiKey}
              onChange={(event) => handleApiKeyChange(event.target.checked)}
              disabled={updateServerSetting_isPending}
            />
          }
          label={allowApiKey ? "許可する" : "許可しない"}
        />
      )}
    </Paper>
  );
};
