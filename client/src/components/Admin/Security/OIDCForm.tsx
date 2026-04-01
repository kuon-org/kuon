// src/components/admin/Auth/OIDCForm.tsx
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Button,
  CircularProgress,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Paper,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  ExpandMore as ExpandMoreIcon,
  ContentCopy,
} from "@mui/icons-material";
import { useAdminQuery } from "../../../hooks/useAdmin";
import { useNotify } from "../../../hooks/useNotify";

interface OIDCFormProps {
  provider_name: string;
  initialData: any;
  isActive: boolean;
  updateIdpConf: (data: {
    provider_name: string;
    config: any;
  }) => Promise<void>;
  toggleActive: (name: string) => void;
}

export const OIDCForm = ({
  provider_name,
  initialData,
  isActive,
  updateIdpConf,
  toggleActive,
}: OIDCFormProps) => {
  const [showSecret, setShowSecret] = useState(false);
  const { fetchDiscovery } = useAdminQuery(provider_name);
  const [copied, setCopied] = useState(false);
  const { success, error } = useNotify();
  const handleCopy = () => {
    navigator.clipboard.writeText(initialData.redirect_uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // コピー後の表示をちょっと出す
  };
  const form = useForm({
    defaultValues: {
      issuer_host: initialData.issuer_host || "",
      client_id: initialData.client_id || "",
      client_secret: initialData.client_secret || "",
      auth_url: initialData.auth_url || "",
      token_url: initialData.token_url || "",
      user_info_url: initialData.user_info_url || "",
      scope: initialData.scope || "openid profile email",
      mapping: {
        id: initialData.mapping?.id || "sub",
        username: initialData.mapping?.username || "preferred_username",
        display_name: initialData.mapping?.display_name || "name",
        avatar_path: initialData.mapping?.avatar_path || "picture",
      },
    },
    onSubmit: async ({ value }) => {
      await updateIdpConf({ provider_name, config: value });
      success("設定を保存しました");
    },
  });

  const handleDiscovery = async () => {
    const host = form.getFieldValue("issuer_host");
    if (!host) return error("Issuer URLを入力してください");
    try {
      const data = await fetchDiscovery(host);
      form.setFieldValue("auth_url", data.auth_url || "");
      form.setFieldValue("token_url", data.token_url || "");
      form.setFieldValue("user_info_url", data.user_info_url || "");
      success("Discovery情報を取得しました");
    } catch (e) {
      error("Discovery情報の取得に失敗しました");
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {provider_name} の設定
      </Typography>
      <Divider />
      <Paper
        sx={{
          p: 2,
          my: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            プロバイダ状態: {isActive ? "有効" : "無効"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            このOIDCプロバイダ経由のログインを許可します
          </Typography>
        </Box>
        <Switch
          checked={isActive}
          onChange={() => toggleActive(provider_name)}
          color="success"
        />
      </Paper>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        autoComplete="off"
      >
        <Grid container spacing={3}>
          <Grid size={12}>
            <TextField
              label="コールバックURL"
              value={initialData.redirect_uri}
              fullWidth
              disabled
              InputProps={{
                readOnly: true, // ここが読み取り専用
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopy}>
                      <ContentCopy
                        fontSize="small"
                        color={copied ? "success" : "inherit"}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="OAuthプロバイダー側の設定で利用してください"
            />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <form.Field name="issuer_host">
                {(field) => (
                  <TextField
                    label="Issuer URL (発行元)"
                    fullWidth
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </Box>
          </Grid>

          <Grid size={12}>
            <form.Field name="client_id">
              {(field) => (
                <TextField
                  label="Client ID"
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </Grid>

          <Grid size={12}>
            <form.Field name="client_secret">
              {(field) => (
                <TextField
                  label="Client Secret"
                  fullWidth
                  type={showSecret ? "text" : "password"}
                  value={field.state.value}
                  autoComplete="new-password"
                  onChange={(e) => field.handleChange(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowSecret(!showSecret)}>
                          {showSecret ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </form.Field>
          </Grid>

          <Grid size={12}>
            <Accordion variant="outlined">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2">
                  エンドポイント・属性マッピング詳細
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleDiscovery}
                    >
                      IssuerURLから自動取得
                    </Button>
                  </Grid>
                  <Grid size={12}>
                    <form.Field name="scope">
                      {(field) => (
                        <TextField
                          label="Scope"
                          fullWidth
                          size="small"
                          value={field.state.value ?? ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </Grid>
                  <Grid size={12}>
                    <form.Field name="auth_url">
                      {(field) => (
                        <TextField
                          label="Auth URL"
                          fullWidth
                          size="small"
                          value={field.state.value ?? ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </Grid>
                  <Grid size={12}>
                    <form.Field name="token_url">
                      {(field) => (
                        <TextField
                          label="Token URL"
                          fullWidth
                          size="small"
                          value={field.state.value ?? ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </Grid>
                  <Grid size={12}>
                    <form.Field name="user_info_url">
                      {(field) => (
                        <TextField
                          label="User Info URL"
                          fullWidth
                          size="small"
                          value={field.state.value ?? ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 4, py: 1.5 }}
              disabled={!canSubmit}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "設定を保存"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </Box>
  );
};
