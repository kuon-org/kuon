import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useAuthQuery } from "../../hooks/useAuth";
import { useLocalRegistrationStatus } from "../../hooks/useLocalRegistrationStatus";
import Loading from "../../components/common/Loading/Loading";
import { useNavigate } from "@tanstack/react-router";
import apiClient from "../../api/client";
import type { HttpError } from "../../api/FetchHttpClient";
import { useNotify } from "../../hooks/useNotify";

const Login: React.FC = () => {
  const { activeIdp, activeIdp_isLoading } = useAuthQuery();
  const registrationStatus = useLocalRegistrationStatus();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useNotify();
  const [serverError, setServerError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (value: { identifier: string; password: string }) => {
      const { data } = await apiClient.post("/login", value);
      return data;
    },
    onSuccess: async (data) => {
      setServerError(null);
      if (data.requires2FA) {
        navigate({ to: "/login/2fa" });
        return;
      }

      notify("ログインしました！");
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate({ to: "/" });
    },
    onError: (error: HttpError) => {
      setServerError(error.response?.data?.message || "認証に失敗しました");
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

  if (activeIdp_isLoading) return <Loading />;

  const localRegistrationAllowed =
    registrationStatus.data?.localAccountRegistrationAllowed ?? true;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mt: 4 }}>
        Kuon にログイン
      </Typography>
      <Divider sx={{ mt: 4 }} />
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          gap: 4,
          flexDirection: {
            xs: "column",
            sm: "row",
          },
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
                {idp.display_name} でログイン
              </Button>
            ))}
          </Box>
        )}
        <Divider orientation={activeIdp ? "vertical" : "horizontal"} flexItem />
        <Divider orientation={activeIdp ? "horizontal" : "vertical"} flexItem />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ローカルアカウントでログイン
          </Typography>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <form.Field name="identifier">
              {(field) => (
                <TextField
                  fullWidth
                  label="メールアドレスまたはユーザーネーム"
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
                  label="パスワード"
                  type="password"
                  margin="normal"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors.join(", ")}
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
                  disabled={!canSubmit || loginMutation.isPending}
                >
                  {loginMutation.isPending || isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "ログイン"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </form>
          {localRegistrationAllowed && (
            <Box sx={{ display: "flex", mx: "auto", justifyContent: "center" }}>
              <NavButton
                fullWidth
                path="/register"
                message="アカウント作成はこちら"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
