import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { NavButton } from "../../components/common/NavButton";

const VerifyEmail = () => {
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = search.get("token") ?? "";
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [verifying, setVerifying] = useState(Boolean(token));
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const response = await fetch(
          `/api/email-verification/verify?token=${encodeURIComponent(token)}`,
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "メール確認に失敗しました");
        setSuccess(data.message || "メールアドレスの確認が完了しました");
      } catch (e) {
        setError(e instanceof Error ? e.message : "メール確認に失敗しました");
      } finally {
        setVerifying(false);
      }
    };

    void verify();
  }, [token]);

  const resend = async () => {
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      const response = await fetch("/api/email-verification/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "確認メールの再送に失敗しました");
      setSuccess(data.message || "確認メールを再送しました");
    } catch (e) {
      setError(e instanceof Error ? e.message : "確認メールの再送に失敗しました");
    } finally {
      setResending(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography component="h1" variant="h5">
          メールアドレスの確認
        </Typography>

        {verifying && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={24} />
            <Typography>確認しています...</Typography>
          </Box>
        )}

        {success && <Alert severity="success">{success}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {!token && (
          <Alert severity="info">
            登録したメールアドレス宛に確認メールを送信しました。メール内のURLを開いて確認を完了してください。
          </Alert>
        )}

        {!verifying && !success && (
          <>
            <TextField
              fullWidth
              type="email"
              label="登録メールアドレス"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              variant="outlined"
              disabled={!email.trim() || resending}
              onClick={resend}
            >
              {resending ? <CircularProgress size={22} /> : "確認メールを再送"}
            </Button>
          </>
        )}

        <NavButton
          path="/login"
          message={success ? "ログインする" : "ログイン画面へ戻る"}
          variant="contained"
          fullWidth
        />
      </Box>
    </Container>
  );
};

export default VerifyEmail;
