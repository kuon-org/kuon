import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { useSmtpSettings } from "../../hooks/useSmtpSettings";
import { useTranslation } from "react-i18next";

export const SmtpSettingsSection = () => {
  const { t } = useTranslation("admin");
  const { smtpSettings, smtpSettingsIsLoading, updateSmtpSettings, updateSmtpSettingsIsPending, sendSmtpTest, sendSmtpTestIsPending } = useSmtpSettings();
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [fromName, setFromName] = useState("Kuon");
  const [testTo, setTestTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!smtpSettings) return;
    setHost(smtpSettings.host); setPort(String(smtpSettings.port)); setSecure(smtpSettings.secure); setUsername(smtpSettings.username); setFromAddress(smtpSettings.fromAddress); setFromName(smtpSettings.fromName); setPassword("");
  }, [smtpSettings]);
  const readOnly = smtpSettings?.readOnly ?? false;

  const handleSave = async () => {
    setMessage(null); setError(null);
    try {
      await updateSmtpSettings({ host, port: Number(port), secure, username, password: password || undefined, fromAddress, fromName });
      setPassword(""); setMessage(t("smtp.saved"));
    } catch (e) { setError(e instanceof Error ? e.message : t("smtp.saveFailed")); }
  };
  const handleTest = async () => {
    setMessage(null); setError(null);
    try { const result = await sendSmtpTest(testTo); setMessage(result.message); }
    catch (e) { setError(e instanceof Error ? e.message : t("smtp.testFailed")); }
  };
  if (smtpSettingsIsLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>;

  return <Box>
    <Typography variant="h5" sx={{ mb: 1 }}>{t("smtp.title")}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("smtp.description")}</Typography>
    {readOnly && <Alert severity="info" sx={{ mb: 2 }}>{t("smtp.envReadOnly")}</Alert>}
    {smtpSettings?.configured && <Alert severity="success" sx={{ mb: 2 }}>{t("smtp.configured")}</Alert>}
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Stack spacing={2}>
      <TextField label="SMTP Host" value={host} onChange={(e) => setHost(e.target.value)} fullWidth disabled={readOnly} />
      <TextField label="SMTP Port" type="number" value={port} onChange={(e) => setPort(e.target.value)} fullWidth disabled={readOnly} />
      <FormControlLabel control={<Switch checked={secure} onChange={(e) => setSecure(e.target.checked)} disabled={readOnly} />} label={t("smtp.useImplicitTls")} />
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth disabled={readOnly} />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={smtpSettings?.passwordConfigured ? t("smtp.passwordConfigured") : ""} helperText={readOnly ? t("smtp.secretHidden") : smtpSettings?.passwordConfigured ? t("smtp.keepPassword") : undefined} fullWidth disabled={readOnly} />
      <TextField label="From Address" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} fullWidth disabled={readOnly} />
      <TextField label="From Name" value={fromName} onChange={(e) => setFromName(e.target.value)} fullWidth disabled={readOnly} />
      {!readOnly && <Box><Button variant="contained" onClick={handleSave} disabled={updateSmtpSettingsIsPending}>{t("smtp.save")}</Button></Box>}
    </Stack>
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{t("smtp.testTitle")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t("smtp.testDescription")}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField label={t("smtp.testTo")} value={testTo} onChange={(e) => setTestTo(e.target.value)} fullWidth />
        <Button variant="outlined" onClick={handleTest} disabled={!smtpSettings?.configured || !testTo || sendSmtpTestIsPending} sx={{ whiteSpace: "nowrap" }}>{t("smtp.testSend")}</Button>
      </Stack>
    </Box>
  </Box>;
};
