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
import apiClient from "../../api/client";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useTranslation } from "react-i18next";

const VerifyEmail = () => {
  const { t } = useTranslation("auth");
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
        await apiClient.get(
          `/email-verification/verify?token=${encodeURIComponent(token)}`,
        );
        setSuccess(t("verifyEmail.verifySuccess"));
      } catch (e) {
        setError(
          getApiErrorMessage(e as ApiError, t("verifyEmail.verifyFailed")),
        );
      } finally {
        setVerifying(false);
      }
    };

    void verify();
  }, [t, token]);

  const resend = async () => {
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      await apiClient.post("/email-verification/resend", {
        email: email.trim(),
      });
      setSuccess(t("verifyEmail.resendSuccess"));
    } catch (e) {
      setError(
        getApiErrorMessage(e as ApiError, t("verifyEmail.resendFailed")),
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography component="h1" variant="h5">
          {t("verifyEmail.title")}
        </Typography>
        {verifying && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={24} />
            <Typography>{t("verifyEmail.verifying")}</Typography>
          </Box>
        )}
        {success && <Alert severity="success">{success}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {!token && <Alert severity="info">{t("verifyEmail.sent")}</Alert>}
        {!verifying && !success && (
          <>
            <TextField
              fullWidth
              type="email"
              label={t("verifyEmail.email")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              variant="outlined"
              disabled={!email.trim() || resending}
              onClick={resend}
            >
              {resending ? (
                <CircularProgress size={22} />
              ) : (
                t("verifyEmail.resend")
              )}
            </Button>
          </>
        )}
        <NavButton
          path="/login"
          message={success ? t("login.loginNow") : t("login.back")}
          variant="contained"
          fullWidth
        />
      </Box>
    </Container>
  );
};

export default VerifyEmail;
