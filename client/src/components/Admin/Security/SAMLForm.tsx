// src/components/admin/Auth/SAMLForm.tsx
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
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ContentCopy } from "@mui/icons-material";

interface SAMLFormProps {
  provider_name: string;
  initialData: any;
  isActive: boolean;
  updateIdpConf: (data: {
    provider_name: string;
    config: any;
    provider_type: string;
  }) => Promise<void>;
  toggleActive: (name: string) => void;
}

export const SAMLForm = ({
  provider_name,
  initialData,
  isActive,
  updateIdpConf,
  toggleActive,
}: SAMLFormProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // SAMLでは一般的に ACS (Assertion Consumer Service) URL と呼ばれる
    const acsUrl =
      initialData.redirect_uri ||
      `${window.location.origin}/api/auth/callback/${provider_name}`;
    navigator.clipboard.writeText(acsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const form = useForm({
    defaultValues: {
      issuer: initialData.issuer || "", // SP Entity ID
      entry_point: initialData.entry_point || "", // IdP SSO URL
      cert: initialData.cert || "", // Public Certificate
      mapping: {
        id: initialData.mapping?.id || "nameID",
        username: initialData.mapping?.username || "email",
        display_name: initialData.mapping?.display_name || "displayName",
      },
    },
    onSubmit: async ({ value }) => {
      await updateIdpConf({
        provider_name,
        config: value,
        provider_type: "SAML",
      });
    },
  });

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
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
            SAML認証を有効化または無効化します
          </Typography>
        </Box>
        <Switch
          checked={isActive}
          onChange={() => toggleActive(provider_name)}
          color="primary"
        />
      </Paper>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Grid container spacing={3}>
          {/* 基本設定 */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              基本設定 (Service Provider)
            </Typography>
            <TextField
              label="ACS URL (Assertion Consumer Service)"
              fullWidth
              size="small"
              value={initialData.redirect_uri || "保存後に生成されます"}
              disabled
              helperText="IdP側の設定（Reply URL / ACS URL）に入力してください"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopy} edge="end">
                      <ContentCopy
                        fontSize="small"
                        color={copied ? "success" : "inherit"}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={12}>
            <form.Field name="issuer">
              {(field) => (
                <TextField
                  label="Entity ID (Issuer)"
                  fullWidth
                  size="small"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  helperText="本アプリケーションの識別子（例: https://your-app.com/saml）"
                />
              )}
            </form.Field>
          </Grid>

          {/* IdP設定 */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              IdP設定 (Identity Provider)
            </Typography>
            <form.Field name="entry_point">
              {(field) => (
                <TextField
                  label="Single Sign-On URL (SSO URL)"
                  fullWidth
                  size="small"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="https://idp.example.com/saml2/sso"
                />
              )}
            </form.Field>
          </Grid>

          <Grid size={12}>
            <form.Field name="cert">
              {(field) => (
                <TextField
                  label="Public Certificate (PEM format)"
                  fullWidth
                  multiline
                  rows={6}
                  size="small"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----\n..."
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                    },
                  }}
                />
              )}
            </form.Field>
          </Grid>

          {/* 属性マッピング */}
          <Grid size={12}>
            <Accordion variant="outlined" sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>属性マッピング設定</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mb: 2 }}
                >
                  SAML
                  Assertion内のどの属性をユーザー情報として使用するか指定します。
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <form.Field name="mapping.id">
                      {(field) => (
                        <TextField
                          label="User ID (NameID or Attribute)"
                          fullWidth
                          size="small"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </Grid>
                  <Grid size={12}>
                    <form.Field name="mapping.username">
                      {(field) => (
                        <TextField
                          label="Username Attribute"
                          fullWidth
                          size="small"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </Grid>
                  <Grid size={12}>
                    <form.Field name="mapping.display_name">
                      {(field) => (
                        <TextField
                          label="Display Name Attribute"
                          fullWidth
                          size="small"
                          value={field.state.value}
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
              {isSubmitting ? <CircularProgress size={24} /> : "SAML設定を保存"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </Box>
  );
};
