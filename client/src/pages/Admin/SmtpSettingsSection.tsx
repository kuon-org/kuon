import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSmtpSettings } from "../../hooks/useSmtpSettings";

export const SmtpSettingsSection = () => {
  const {
    smtpSettings,
    smtpSettingsIsLoading,
    updateSmtpSettings,
    updateSmtpSettingsIsPending,
    sendSmtpTest,
    sendSmtpTestIsPending,
  } = useSmtpSettings();

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
    setHost(smtpSettings.host);
    setPort(String(smtpSettings.port));
    setSecure(smtpSettings.secure);
    setUsername(smtpSettings.username);
    setFromAddress(smtpSettings.fromAddress);
    setFromName(smtpSettings.fromName);
    setPassword("");
  }, [smtpSettings]);

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      await updateSmtpSettings({
        host,
        port: Number(port),
        secure,
        username,
        password: password || undefined,
        fromAddress,
        fromName,
      });
      setPassword("");
      setMessage("SMTP設定を保存しました");
    } catch (e) {
      setError(e instanceof Error ? e.message : "SMTP設定の保存に失敗しました");
    }
  };

  const handleTest = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await sendSmtpTest(testTo);
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "テストメールの送信に失敗しました");
    }
  };

  if (smtpSettingsIsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>SMTP / Mail</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Email VerificationやPassword Resetなどで利用する共通メール送信設定です。未設定でもKuonの既存機能は利用できます。
      </Typography>

      {smtpSettings?.configured && (
        <Alert severity="success" sx={{ mb: 2 }}>SMTPは設定済みです。</Alert>
      )}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack spacing={2}>
        <TextField label="SMTP Host" value={host} onChange={(e) => setHost(e.target.value)} fullWidth />
        <TextField label="SMTP Port" type="number" value={port} onChange={(e) => setPort(e.target.value)} fullWidth />
        <FormControlLabel
          control={<Switch checked={secure} onChange={(e) => setSecure(e.target.checked)} />}
          label="Implicit TLS / SMTPSを使用する"
        />
        <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={smtpSettings?.passwordConfigured ? "設定済み（変更する場合のみ入力）" : ""}
          helperText={smtpSettings?.passwordConfigured ? "空欄のまま保存すると現在のPasswordを維持します。" : undefined}
          fullWidth
        />
        <TextField label="From Address" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} fullWidth />
        <TextField label="From Name" value={fromName} onChange={(e) => setFromName(e.target.value)} fullWidth />
        <Box>
          <Button variant="contained" onClick={handleSave} disabled={updateSmtpSettingsIsPending}>
            SMTP設定を保存
          </Button>
        </Box>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>テストメール</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          保存済みのSMTP設定を使って実際にメールを1通送信します。
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField label="送信先メールアドレス" value={testTo} onChange={(e) => setTestTo(e.target.value)} fullWidth />
          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={!smtpSettings?.configured || !testTo || sendSmtpTestIsPending}
            sx={{ whiteSpace: "nowrap" }}
          >
            テスト送信
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
