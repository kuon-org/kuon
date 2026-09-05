import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../../api/client";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useTranslation } from "react-i18next";

const ChangePassword = () => {
  const { t } = useTranslation("auth");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => apiClient.put("/password/change", { currentPassword, newPassword }),
    onSuccess: () => {
      setSuccess(true);
      setMessage(t("changePassword.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: ApiError) => {
      setSuccess(false);
      setMessage(
        getApiErrorMessage(error, t("changePassword.failed"), {
          CURRENT_PASSWORD_INVALID: t("changePassword.currentPasswordInvalid"),
        }),
      );
    },
  });

  const invalid = !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword;

  return (
    <Paper sx={{ mx: "auto", flex: 1, p: 3, minWidth: { xs: "100%", sm: "100%", md: "600px", lg: "850px" } }}>
      <Typography variant="h5" sx={{ mb: 1 }}>{t("changePassword.title")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t("changePassword.description")}</Typography>
      {message && <Alert severity={success ? "success" : "error"} sx={{ mb: 2 }}>{message}</Alert>}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label={t("changePassword.currentPassword")} type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} fullWidth />
        <TextField label={t("changePassword.newPassword")} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} helperText={newPassword.length > 0 && newPassword.length < 6 ? t("validation.minLength", { min: 6 }) : undefined} fullWidth />
        <TextField label={t("changePassword.confirmPassword")} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={confirmPassword.length > 0 && newPassword !== confirmPassword} helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? t("validation.passwordMismatch") : undefined} fullWidth />
        <Button variant="contained" disabled={invalid || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <CircularProgress size={24} /> : t("changePassword.submit")}
        </Button>
      </Box>
    </Paper>
  );
};

export default ChangePassword;
