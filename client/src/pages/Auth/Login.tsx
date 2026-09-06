import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { NavButton } from "../../components/common/NavButton";
import { useActiveIdpsQuery } from "../../hooks/auth";
import { useLocalRegistrationStatus } from "../../hooks/useLocalRegistrationStatus";
import Loading from "../../components/common/Loading/Loading";
import { useNavigate } from "@tanstack/react-router";
import apiClient from "../../api/client";
import type { ApiError } from "../../api/FetchHttpClient";
import { useNotify } from "../../hooks/useNotify";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useTranslation } from "react-i18next";

const Login: React.FC = () => {
  const { t } = useTranslation("auth");
  const activeIdpQuery = useActiveIdpsQuery();
  const activeIdp = activeIdpQuery.data;
  const registrationStatus = useLocalRegistrationStatus();
  const passwordResetStatus = useQuery({
    queryKey: ["passwordResetStatus"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ available: boolean }>("/password-reset/status");
      return data;
    },
    retry: false,
    staleTime: 60_000,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useNotify();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (value: { identifier: string; password: string }) => {
      const { data } = await apiClient.post("/login", value);
      return data;
    },
    onSuccess: async (data) => {
      setServerError(null);
      setNeedsEmailVerification(false);
      if (data.requires2FA) {
        navigate({ to: "/login/2fa" });
        return;
      }

      notify(t("login.success"));
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate({ to: "/" });
    },
    onError: (error: ApiError) => {
      setServerError(
        getApiErrorMessage(error, t("login.failed"), {
          EMAIL_VERIFICATION_REQUIRED: t("login.emailVerificationRequired"),
          INVALID_CREDENTIALS: t("login.invalidCredentials"),
        }),
      );
      setNeedsEmailVerification(error.code === "EMAIL_VERIFICATION_REQUIRED");
    },
  });

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value);
    },
  });

  if (activeIdpQuery.isLoading) return <Loading />;

  const localRegistrationAllowed =
    registrationStatus.data?.localAccountRegistrationAllowed ?? true;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mt: 4 }}>
        {t("login.title")}
      </Typography>
      <Divider sx={{ mt: 4 }} />
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          gap: 4,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {activeIdp && activeIdp.length > 0 && (
          <Box sx={{ mt: 4, flex: 1 }}>
            {activeIdp.map((idp) => (
              <Button
                key={idp.provider_name}
                fullWidth
                variant="outlined"
                startIcon={
                  idp.logo_url ? (
                    <img
                      src={idp.logo_url}
                      alt={idp.display_name}
                      style={{ width: 20, height: 20, borderRadius: 4 }}
                    />
                  ) : null
                }
                href={`/auth/${idp.provider_name}/login`}
                sx={{ mb: 1 }}
              >
                {t("login.idpButton", { provider: idp.display_name })}
              </Button>
            ))}
          </Box>
        )}
        <Divider orientation={activeIdp ? "vertical" : "horizontal"} flexItem />
        <Divider orientation={activeIdp ? "horizontal" : "vertical"} flexItem />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t("login.localTitle")}
          </Typography>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
            {needsEmailVerification && (
              <Box sx={{ mb: 2 }}>
                <NavButton fullWidth path="/verify-email" message={t("login.resendVerification")} variant="outlined" />
              </Box>
            )}
            <form.Field name="identifier">
              {(field) => (
                <TextField
                  fullWidth
                  label={t("login.identifier")}
                  margin="normal"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors.join(", ")}
                />
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <TextField
                  fullWidth
                  label={t("login.password")}
                  type="password"
                  margin="normal"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors.join(", ")}
                />
              )}
            </form.Field>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={!canSubmit || loginMutation.isPending}
                >
                  {loginMutation.isPending || isSubmitting ? <CircularProgress size={24} /> : t("login.submit")}
                </Button>
              )}
            </form.Subscribe>
          </form>
          {passwordResetStatus.data?.available && (
            <Box sx={{ mb: 2 }}>
              <NavButton fullWidth path="/forgot-password" message={t("login.forgotPassword")} variant="text" />
            </Box>
          )}
          {localRegistrationAllowed && (
            <Box sx={{ display: "flex", mx: "auto", justifyContent: "center" }}>
              <NavButton fullWidth path="/register" message={t("login.createAccount")} variant="outlined" />
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
