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
  Paper,
  Switch,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, ContentCopy } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../../hooks/useNotify";

interface TemplateFormProps {
  provider_name: string;
  initialData: {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
  };
  isActive: boolean;
  updateIdpConf: any;
  toggleActive: any;
}

export const OAuth2TemplateForm = ({
  provider_name,
  initialData,
  isActive,
  updateIdpConf,
  toggleActive,
}: TemplateFormProps) => {
  const { t } = useTranslation("admin");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const { success } = useNotify();
  const handleCopy = () => {
    navigator.clipboard.writeText(initialData.redirect_uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const form = useForm({
    defaultValues: {
      client_id: initialData.client_id,
      client_secret: initialData.client_secret,
    },
    onSubmit: async ({ value }) => {
      await updateIdpConf({ provider_name, config: value });
      success(t("security.idp.form.updated"));
    },
  });

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {t("security.idp.form.providerSettings", { provider: provider_name })}
      </Typography>
      <Divider />
      <Paper
        sx={{
          p: 3,
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
            {t("security.idp.form.loginAllowed", { type: "OAuth2" })}
          </Typography>
        </Box>
        <Switch
          checked={isActive}
          onChange={() => toggleActive(provider_name)}
          color="success"
        />
      </Paper>
      <Box mt={2}>
        <TextField
          label={t("security.idp.form.callbackUrl")}
          value={initialData.redirect_uri}
          fullWidth
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleCopy}>
                  <ContentCopy />
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={copied ? t("security.idp.form.copied") : ""}
        />
        <Typography variant="caption" color="gray">
          {t("security.idp.form.callbackHint")}
        </Typography>
      </Box>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        autoComplete="off"
      >
        <form.Field name="client_id">
          {(field) => (
            <TextField
              fullWidth
              label={t("security.idp.form.clientId")}
              margin="normal"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              error={field.state.meta.errors.length > 0}
            />
          )}
        </form.Field>

        <form.Field name="client_secret">
          {(field) => (
            <TextField
              fullWidth
              label={t("security.idp.form.clientSecret")}
              margin="normal"
              type={showSecret ? "text" : "password"}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              error={field.state.meta.errors.length > 0}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowSecret(!showSecret)}
                      edge="end"
                    >
                      {showSecret ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                t("common.update")
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </Box>
  );
};
