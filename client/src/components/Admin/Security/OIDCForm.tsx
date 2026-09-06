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
import { useTranslation } from "react-i18next";
import { fetchIdpDiscovery } from "../../../hooks/admin";
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
  const { t } = useTranslation("admin");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const { success, error } = useNotify();
  const handleCopy = () => {
    navigator.clipboard.writeText(initialData.redirect_uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
      success(t("security.idp.form.saved"));
    },
  });

  const handleDiscovery = async () => {
    const host = form.getFieldValue("issuer_host");
    if (!host) return error(t("security.idp.oidc.issuerRequired"));
    try {
      const data = await fetchIdpDiscovery(host);
      form.setFieldValue("auth_url", data.auth_url || "");
      form.setFieldValue("token_url", data.token_url || "");
      form.setFieldValue("user_info_url", data.user_info_url || "");
      success(t("security.idp.oidc.discoverySuccess"));
    } catch {
      error(t("security.idp.oidc.discoveryFailed"));
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {t("security.idp.form.providerSettings", { provider: provider_name })}
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
            {t("security.idp.form.providerState", {
              state: isActive ? t("common.enabled") : t("common.disabled"),
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("security.idp.form.loginAllowed", { type: "OIDC" })}
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
              label={t("security.idp.form.callbackUrl")}
              value={initialData.redirect_uri}
              fullWidth
              disabled
              InputProps={{
                readOnly: true,
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
              helperText={t("security.idp.form.callbackHint")}
            />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <form.Field name="issuer_host">
                {(field) => (
                  <TextField
                    label={t("security.idp.oidc.issuerUrl")}
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
                  {t("security.idp.oidc.advanced")}
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
                      {t("security.idp.oidc.discovery")}
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
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                t("security.idp.form.saveSettings")
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </Box>
  );
};
