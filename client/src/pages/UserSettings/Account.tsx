import { Alert, Avatar, Box, Button, Divider, Grid, Paper, Radio, Stack, TextField, Typography } from "@mui/material";
import {
  useActiveIdpsQuery,
  useAuthUserQuery,
  useSwitchAvatar,
  useUnlinkIdentity,
  useUpdateUsername,
  useUserIdpInfoQuery,
} from "../../hooks/auth";
import { useForm } from "@tanstack/react-form";
import Loading from "../../components/common/Loading/Loading";
import { Link } from "@tanstack/react-router";
import { accountCustomImageRoute } from "../../routes";
import { useTranslation } from "react-i18next";

export const Account = () => {
  const { t } = useTranslation("settings");
  const authUserQuery = useAuthUserQuery();
  const user = authUserQuery.data;
  const activeIdpQuery = useActiveIdpsQuery();
  const idpInfoQuery = useUserIdpInfoQuery(!!user);
  const updateUsername = useUpdateUsername();
  const switchAvatar = useSwitchAvatar();
  const unlinkIdentity = useUnlinkIdentity();
  const userAvatars = idpInfoQuery.data?.user_avatars;
  const userIdentities = idpInfoQuery.data?.user_identities;
  const form = useForm({ defaultValues: { username: user?.username ?? "" }, onSubmit: async ({ value }) => { await updateUsername.mutation.mutateAsync(value); } });
  const hasLocalAvatar = userAvatars?.some((avatar) => avatar.service_name === "local");
  const isLinked = (providerName: string) => userIdentities?.some((identity) => identity.identity_providers.provider_name === providerName);
  if (activeIdpQuery.isLoading || idpInfoQuery.isLoading) return <Loading />;

  return (
    <Paper sx={{ mx: "auto", flex: 1, p: 3, minWidth: { xs: "100%", sm: "100%", md: "600px", lg: "850px" } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{t("account.title")}</Typography>
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("account.avatar")}</Typography>
        <Grid container spacing={2}>
          {userAvatars?.map((avatar) => (
            <Grid key={avatar.id}>
              <Paper variant="outlined" sx={{ p: 1, display: "flex", flexDirection: "column", alignItems: "center", borderColor: avatar.is_selected ? "primary.main" : "divider", bgcolor: avatar.is_selected ? "action.selected" : "background.paper", cursor: "pointer", minWidth: 100 }} onClick={() => !avatar.is_selected && switchAvatar.mutate(avatar.id)}>
                <Avatar src={avatar.avatar_url} sx={{ width: 64, height: 64, mb: 1, bgcolor: "grey.200" }} />
                <Typography variant="caption" color="text.secondary">{avatar.service_name}</Typography>
                <Radio checked={avatar.is_selected} disabled={switchAvatar.isPending} size="small" />
                {avatar.service_name === "local" && <Link onClick={(e) => e.stopPropagation()} to={accountCustomImageRoute.to} style={{ fontSize: "0.75rem", marginTop: "4px" }}>{t("account.changeImage")}</Link>}
              </Paper>
            </Grid>
          ))}
          {!hasLocalAvatar && (
            <Grid>
              <Paper variant="outlined" sx={{ p: 1, width: 100, height: "100%", display: "flex", justifyContent: "center", alignItems: "center", borderStyle: "dashed" }}>
                <Link to={accountCustomImageRoute.to} style={{ textAlign: "center", fontSize: "0.875rem", textDecoration: "none", whiteSpace: "pre-line" }}>{t("account.uploadImage")}</Link>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
      <Divider sx={{ my: 3 }} />
      <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
        {updateUsername.serverError && <Alert severity="error" sx={{ mb: 2 }}>{updateUsername.serverError}</Alert>}
        {updateUsername.successMessage && <Alert severity="success" sx={{ mb: 2 }}>{updateUsername.successMessage}</Alert>}
        <Stack spacing={2}>
          <form.Field name="username" validators={{ onChange: ({ value }) => !value ? t("common.required", { field: t("account.usernameField") }) : value.length > 50 ? t("common.maxLength", { max: 50 }) : undefined }} children={(field) => <TextField label={t("account.username")} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} error={!!field.state.meta.errors.length} helperText={field.state.meta.errors.join(", ")} fullWidth />} />
          <Button variant="contained" size="small" type="submit" disabled={updateUsername.mutation.isPending} sx={{ alignSelf: "flex-start", mt: 1, width: "fit-content" }}>{updateUsername.mutation.isPending ? t("common.updating") : t("common.update")}</Button>
        </Stack>
      </form>
      <Divider sx={{ mt: 3 }} />
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="h6">{t("account.externalServices")}</Typography>
        {activeIdpQuery.data?.map((idp) => {
          const linked = isLinked(idp.provider_name);
          return (
            <Button key={idp.provider_name} size="small" variant={linked ? "contained" : "outlined"} color={linked ? "error" : "primary"} startIcon={idp.logo_url ? <img src={idp.logo_url} alt={idp.display_name} style={{ width: 20, height: 20, borderRadius: 4, filter: linked ? "brightness(0) invert(1)" : "none" }} /> : null} onClick={(e) => { if (linked) { e.preventDefault(); if (window.confirm(t("account.unlinkConfirm", { provider: idp.display_name }))) unlinkIdentity.mutate(idp.provider_name); } }} href={linked ? undefined : `/auth/${idp.provider_name}/login`} disabled={unlinkIdentity.isPending} sx={{ alignSelf: "flex-start", mt: 1, width: "fit-content" }}>
              {linked ? t("account.unlink", { provider: idp.display_name }) : t("account.link", { provider: idp.display_name })}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
};
