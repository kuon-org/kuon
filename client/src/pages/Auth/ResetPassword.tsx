import { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { NavButton } from "../../components/common/NavButton";
import apiClient from "../../api/client";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const { t } = useTranslation("auth");
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => apiClient.post("/password-reset/reset", { token, newPassword: password }),
    onSuccess: () => {
      setCompleted(true);
      setMessage(t("resetPassword.success"));
    },
    onError: (error: ApiError) => {
      setMessage(
        getApiErrorMessage(error, t("resetPassword.failed"), {
          PASSWORD_RESET_TOKEN_INVALID: t("resetPassword.invalidUrl"),
          PASSWORD_RESET_TOKEN_EXPIRED: t("resetPassword.expiredUrl"),
        }),
      );
    },
  });

  const validationError =
    !token
      ? t("resetPassword.invalidUrl")
      : password.length > 0 && password.length < 6
        ? t("validation.passwordMinLength", { min: 6 })
        : confirmPassword.length > 0 && password !== confirmPassword
          ? t("validation.confirmPasswordMismatch")
          : null;

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h5">{t("resetPassword.title")}</Typography>
        {message && <Alert severity={completed ? "success" : "error"}>{message}</Alert>}
        {!completed && (
          <>
            <TextField label={t("resetPassword.newPassword")} type="password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth error={!!validationError && password.length > 0} />
            <TextField label={t("resetPassword.confirmPassword")} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} fullWidth error={password !== confirmPassword && confirmPassword.length > 0} helperText={validationError} />
            <Button variant="contained" disabled={mutation.isPending || !token || password.length < 6 || password !== confirmPassword} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <CircularProgress size={24} /> : t("resetPassword.submit")}
            </Button>
          </>
        )}
        <NavButton path="/login" message={t("login.goToLogin")} variant="outlined" fullWidth />
      </Box>
    </Container>
  );
};

export default ResetPassword;
