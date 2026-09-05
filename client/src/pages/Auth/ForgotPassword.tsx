import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Container, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { NavButton } from "../../components/common/NavButton";
import apiClient from "../../api/client";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ["passwordResetStatus"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ available: boolean }>("/password-reset/status");
      return data;
    },
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async () => apiClient.post("/password-reset/request", { email }),
    onSuccess: () => setMessage(t("forgotPassword.requested")),
    onError: () => setMessage(t("forgotPassword.requestFailed")),
  });

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h5">{t("forgotPassword.title")}</Typography>
        {status.data?.available === false ? (
          <Alert severity="info">{t("forgotPassword.unavailable")}</Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">{t("forgotPassword.description")}</Typography>
            {message && <Alert severity="info">{message}</Alert>}
            <TextField label={t("forgotPassword.email")} type="email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
            <Button variant="contained" disabled={!email.trim() || mutation.isPending || status.isLoading} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <CircularProgress size={24} /> : t("forgotPassword.submit")}
            </Button>
          </>
        )}
        <NavButton path="/login" message={t("login.back")} variant="outlined" fullWidth />
      </Box>
    </Container>
  );
};

export default ForgotPassword;
