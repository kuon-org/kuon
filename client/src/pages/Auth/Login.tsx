import React from "react";
import { useForm } from "@tanstack/react-form";
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
import Loading from "../../components/common/Loading/Loading";
import { useNavigate } from "@tanstack/react-router";

const Login: React.FC = () => {
  const {
    login,
    login_isPending,
    serverError,
    activeIdp,
    activeIdp_isLoading,
  } = useAuthQuery();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      login(value, {
        onSuccess: async (data) => {
          if (data.requires2FA) {
            // pending状態はHttpOnly Cookieで管理するため、emailは保持しない
            sessionStorage.removeItem("pendingEmail");
            navigate({ to: "/login/2fa" });
          } else {
            navigate({ to: "/" });
          }
        },
      });
    },
  });
  if (activeIdp_isLoading) return <Loading />;
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
                  disabled={!canSubmit || login_isPending}
                >
                  {login_isPending || isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "ログイン"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </form>
          <Box sx={{ display: "flex", mx: "auto", justifyContent: "center" }}>
            <NavButton
              fullWidth
              path="/register"
              message="アカウント作成はこちら"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
