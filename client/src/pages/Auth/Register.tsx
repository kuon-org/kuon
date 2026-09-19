import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Alert,
  CircularProgress,
} from "@mui/material";
import { NavButton } from "../../components/common/NavButton";
import { useNavigate } from "@tanstack/react-router";
import { useLocalRegistrationStatus } from "../../hooks/useLocalRegistrationStatus";
import apiClient from "../../api/client";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useTranslation } from "react-i18next";

type UsernameRules = {
  reservedUsernames: string[];
  pattern: string;
  minLength: number;
  maxLength: number;
};

type RegisterForm = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

const Register: React.FC = () => {
  const { t } = useTranslation("auth");
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const registrationStatus = useLocalRegistrationStatus();
  const usernameRulesQuery = useQuery({
    queryKey: ["username-rules"],
    queryFn: async (): Promise<UsernameRules> => {
      const { data } = await apiClient.get<UsernameRules>("/username-rules");
      return data;
    },
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => apiClient.post("/register", data),
    onSuccess: (_data, variables) => {
      if (registrationStatus.data?.emailVerificationRequired) {
        window.location.assign(
          `/verify-email?email=${encodeURIComponent(variables.email)}`,
        );
        return;
      }
      alert(t("register.success"));
      navigate({ to: "/login" });
    },
    onError: (error: ApiError) => {
      setServerError(
        getApiErrorMessage(error, t("register.registrationFailed"), {
          USERNAME_ALREADY_EXISTS: t("register.usernameAlreadyExists"),
          USERNAME_RESERVED: t("register.usernameReserved"),
          EMAIL_ALREADY_EXISTS: t("register.emailAlreadyExists"),
        }),
      );
    },
  });

  const form = useForm({
    defaultValues: { username: "", displayName: "", email: "", password: "" },
    onSubmit: async ({ value }) =>
      mutation.mutate({
        ...value,
        username: value.username.trim().toLowerCase(),
      }),
  });

  if (registrationStatus.isLoading) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (registrationStatus.data?.localAccountRegistrationAllowed === false) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography component="h1" variant="h5">
            {t("register.title")}
          </Typography>
          <Alert severity="info">{t("register.disabled")}</Alert>
          <NavButton
            path="/login"
            message={t("login.back")}
            variant="outlined"
            fullWidth
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          {t("register.title")}
        </Typography>
        {registrationStatus.data?.initialSetup && (
          <Alert severity="info" sx={{ mt: 2, width: "100%" }}>
            {t("register.initialSetup")}
          </Alert>
        )}
        {registrationStatus.data?.emailVerificationRequired && (
          <Alert severity="info" sx={{ mt: 2, width: "100%" }}>
            {t("register.emailVerificationRequired")}
          </Alert>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          style={{ width: "100%", marginTop: "24px" }}
        >
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}
          {usernameRulesQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t("register.usernameRulesUnavailable")}
            </Alert>
          )}
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                const normalized = value.trim().toLowerCase();
                if (!normalized)
                  return t("validation.required", {
                    field: t("register.username"),
                  });
                const rules = usernameRulesQuery.data;
                if (
                  rules &&
                  (normalized.length < rules.minLength ||
                    normalized.length > rules.maxLength)
                )
                  return t("validation.usernameLength", {
                    min: rules.minLength,
                    max: rules.maxLength,
                  });
                if (
                  rules?.pattern &&
                  !new RegExp(rules.pattern).test(normalized)
                )
                  return t("validation.usernamePattern");
                if (rules?.reservedUsernames.includes(normalized))
                  return t("validation.usernameReserved");
                return undefined;
              },
            }}
          >
            {(field) => (
              <TextField
                fullWidth
                label={t("register.username")}
                margin="normal"
                value={field.state.value}
                inputProps={{ maxLength: usernameRulesQuery.data?.maxLength }}
                onBlur={() => {
                  field.handleChange(field.state.value.trim().toLowerCase());
                  field.handleBlur();
                }}
                onChange={(e) =>
                  field.handleChange(e.target.value.toLowerCase())
                }
                error={field.state.meta.errors.length > 0}
                helperText={
                  field.state.meta.errors.join(", ") ||
                  t("validation.usernameHint", {
                    min: usernameRulesQuery.data?.minLength ?? 4,
                    max: usernameRulesQuery.data?.maxLength ?? 16,
                  })
                }
                disabled={usernameRulesQuery.isLoading}
              />
            )}
          </form.Field>
          <form.Field
            name="displayName"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? t("validation.required", {
                      field: t("register.displayName"),
                    })
                  : undefined,
            }}
          >
            {(field) => (
              <TextField
                fullWidth
                label={t("register.displayName")}
                margin="normal"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors.join(", ")}
              />
            )}
          </form.Field>
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value)
                  return t("validation.required", {
                    field: t("register.email"),
                  });
                if (!/^\S+@\S+$/.test(value))
                  return t("validation.invalidFormat");
                return undefined;
              },
            }}
          >
            {(field) => (
              <TextField
                fullWidth
                label={t("register.email")}
                type="email"
                margin="normal"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors.join(", ")}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value.length < 6
                  ? t("validation.passwordMinLength", { min: 6 })
                  : undefined,
            }}
          >
            {(field) => (
              <TextField
                fullWidth
                label={t("register.password")}
                type="password"
                margin="normal"
                value={field.state.value}
                onBlur={field.handleBlur}
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
                disabled={!canSubmit || mutation.isPending}
              >
                {mutation.isPending || isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  t("register.submit")
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
        <NavButton
          path="/login"
          message={t("register.loginLink")}
          variant="outlined"
          fullWidth
        />
      </Box>
    </Container>
  );
};

export default Register;
