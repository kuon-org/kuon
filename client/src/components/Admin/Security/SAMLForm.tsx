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
  MenuItem,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ContentCopy } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("admin");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const acsUrl =
      initialData.redirect_uri ||
      `${window.location.origin}/api/auth/callback/${provider_name}`;
    navigator.clipboard.writeText(acsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const form = useForm({
    defaultValues: {
      issuer: initialData.issuer || "",
      entry_point: initialData.entry_point || "",
      cert: initialData.cert || "",
      clockSkewSeconds: initialData.clockSkewSeconds || 0,
      requestIdExpirationMs: initialData.requestIdExpirationMs || 28800000,
      wantAssertionsSigned: initialData.wantAssertionsSigned ?? true,
      wantAuthnResponseSigned: initialData.wantAuthnResponseSigned ?? false,
      disableRequestedAuthnContext:
        initialData.disableRequestedAuthnContext ?? false,
      signAuthnRequest:
        initialData.signAuthnRequest ?? initialData.sign_authn_request ?? false,
      private_key: "",
      public_cert: initialData.public_cert || "",
      identifier_format:
        initialData.identifier_format ||
        "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
      signature_algorithm: initialData.signature_algorithm || "sha256",
      digest_algorithm:
        initialData.digest_algorithm ||
        initialData.signature_algorithm ||
        "sha256",
      mapping: {
        id: initialData.mapping?.id || "nameID",
        username: initialData.mapping?.username || "email",
        display_name: initialData.mapping?.display_name || "displayName",
      },
    },
    onSubmit: async ({ value }) => {
      const config: Record<string, unknown> = { ...value };
      if (!value.private_key) {
        delete config.private_key;
      }

      await updateIdpConf({
        provider_name,
        config,
        provider_type: "SAML",
      });
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
            {t("security.idp.form.loginAllowed", { type: "SAML" })}
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
            <Typography variant="h6" gutterBottom>
              {t("security.idp.saml.basicSettings")}
            </Typography>
            <TextField
              label="ACS URL (Assertion Consumer Service)"
              fullWidth
              size="small"
              value={
                initialData.redirect_uri ||
                t("security.idp.saml.generatedAfterSave")
              }
              disabled
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
              helperText={t("security.idp.saml.acsHint")}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              label="SP Metadata URL"
              fullWidth
              size="small"
              value={`${window.location.origin}/auth/${provider_name}/metadata`}
              disabled
              helperText="IdPへKuonのSP設定を登録する際に利用できます。"
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
                  helperText={t("security.idp.saml.issuerHint")}
                />
              )}
            </form.Field>
          </Grid>

          <Grid size={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {t("security.idp.saml.idpSettings")}
            </Typography>
            <form.Field name="entry_point">
              {(field) => (
                <TextField
                  label="Single Sign-On URL"
                  fullWidth
                  size="small"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="https://example.com/saml/sso"
                />
              )}
            </form.Field>
          </Grid>

          <Grid size={12}>
            <form.Field name="cert">
              {(field) => (
                <TextField
                  label="IdP Public Certificate (PEM format)"
                  fullWidth
                  multiline
                  rows={10}
                  size="small"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                    },
                  }}
                  placeholder="-----BEGIN CERTIFICATE----- ..."
                />
              )}
            </form.Field>
          </Grid>

          <Grid size={12}>
            <Accordion variant="outlined" sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {t("security.idp.saml.advancedSettings")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <form.Field name="clockSkewSeconds">
                      {(field) => (
                        <TextField
                          label={t("security.idp.saml.clockSkew")}
                          type="number"
                          fullWidth
                          size="small"
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          helperText={t("security.idp.saml.clockSkewHint")}
                        />
                      )}
                    </form.Field>
                  </Grid>
                  <Grid size={6}>
                    <form.Field name="requestIdExpirationMs">
                      {(field) => (
                        <TextField
                          label="Request Expiration (ms)"
                          type="number"
                          fullWidth
                          size="small"
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          helperText={t("security.idp.saml.expirationHint")}
                        />
                      )}
                    </form.Field>
                  </Grid>

                  <Grid size={12}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <form.Field name="wantAssertionsSigned">
                        {(field) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.checked)
                                }
                              />
                            }
                            label={t(
                              "security.idp.saml.requireAssertionSignature",
                            )}
                          />
                        )}
                      </form.Field>
                      <form.Field name="wantAuthnResponseSigned">
                        {(field) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.checked)
                                }
                              />
                            }
                            label={t(
                              "security.idp.saml.requireResponseSignature",
                            )}
                          />
                        )}
                      </form.Field>
                      <form.Field name="disableRequestedAuthnContext">
                        {(field) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.checked)
                                }
                              />
                            }
                            label={t(
                              "security.idp.saml.disableRequestedAuthnContext",
                            )}
                          />
                        )}
                      </form.Field>
                      <form.Field name="signAuthnRequest">
                        {(field) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.checked)
                                }
                              />
                            }
                            label="Sign AuthnRequest"
                          />
                        )}
                      </form.Field>
                    </Box>
                  </Grid>

                  <Grid size={6}>
                    <form.Field name="signature_algorithm">
                      {(field) => (
                        <TextField
                          select
                          label={t("security.idp.saml.signatureAlgorithm")}
                          fullWidth
                          size="small"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        >
                          <MenuItem value="sha256">SHA-256</MenuItem>
                          <MenuItem value="sha512">SHA-512</MenuItem>
                          <MenuItem value="sha1">
                            {t("security.idp.saml.sha1Deprecated")}
                          </MenuItem>
                        </TextField>
                      )}
                    </form.Field>
                  </Grid>
                  <Grid size={6}>
                    <form.Field name="digest_algorithm">
                      {(field) => (
                        <TextField
                          select
                          label="Digest Algorithm"
                          fullWidth
                          size="small"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        >
                          <MenuItem value="sha256">SHA-256</MenuItem>
                          <MenuItem value="sha512">SHA-512</MenuItem>
                          <MenuItem value="sha1">SHA-1 (deprecated)</MenuItem>
                        </TextField>
                      )}
                    </form.Field>
                  </Grid>

                  <form.Subscribe
                    selector={(state) => state.values.signAuthnRequest}
                  >
                    {(signAuthnRequest) =>
                      signAuthnRequest ? (
                        <>
                          <Grid size={12}>
                            <form.Field name="private_key">
                              {(field) => (
                                <TextField
                                  label="SP Private Key (PEM)"
                                  fullWidth
                                  multiline
                                  rows={8}
                                  size="small"
                                  value={field.state.value}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  placeholder="-----BEGIN PRIVATE KEY----- ..."
                                  helperText="DB設定では暗号化して保存され、APIからは返却されません。空欄のまま保存すると既存の秘密鍵を維持します。"
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
                          <Grid size={12}>
                            <form.Field name="public_cert">
                              {(field) => (
                                <TextField
                                  label="SP Public Certificate (PEM)"
                                  fullWidth
                                  multiline
                                  rows={8}
                                  size="small"
                                  value={field.state.value}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  placeholder="-----BEGIN CERTIFICATE----- ..."
                                  helperText="秘密鍵に対応する証明書です。SP Metadataにも公開されます。"
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
                        </>
                      ) : null
                    }
                  </form.Subscribe>

                  <Grid size={12}>
                    <form.Field name="identifier_format">
                      {(field) => (
                        <TextField
                          label="Identifier Format"
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

          <Grid size={12}>
            <Accordion variant="outlined">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {t("security.idp.saml.attributeMapping")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <form.Field name="mapping.id">
                      {(field) => (
                        <TextField
                          label="User ID Attribute (e.g. nameID)"
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
                          label="Username / Email Attribute"
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
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                t("security.idp.saml.save")
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </Box>
  );
};
