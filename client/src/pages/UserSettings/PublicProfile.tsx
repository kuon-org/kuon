import { Alert, Paper, Typography, TextField, Button, Stack } from "@mui/material";
import { useAuthUserQuery, useUpdateUserInfo } from "../../hooks/auth";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

export const PublicProfile = () => {
  const { t } = useTranslation("settings");
  const authUserQuery = useAuthUserQuery();
  const updateUserInfo = useUpdateUserInfo();
  const user = authUserQuery.data;
  const form = useForm({
    defaultValues: { displayName: user?.display_name ?? "", bio: typeof user?.bio === "string" ? user.bio : "" },
    onSubmit: async ({ value }) => { await updateUserInfo.mutation.mutateAsync(value); },
  });

  return (
    <Paper sx={{ mx: "auto", flex: 1, p: 3, minWidth: { xs: "100%", sm: "100%", md: "600px", lg: "850px" } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{t("profile.title")}</Typography>
      <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
        {updateUserInfo.serverError && <Alert severity="error" sx={{ mb: 2 }}>{updateUserInfo.serverError}</Alert>}
        {updateUserInfo.successMessage && <Alert severity="success" sx={{ mb: 2 }}>{updateUserInfo.successMessage}</Alert>}
        <Stack spacing={2}>
          <form.Field name="displayName" validators={{ onChange: ({ value }) => !value ? t("common.required", { field: t("profile.displayName") }) : value.length > 50 ? t("common.maxLength", { max: 50 }) : undefined }} children={(field) => <TextField label={t("profile.displayName")} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} error={!!field.state.meta.errors.length} helperText={field.state.meta.errors.join(", ")} fullWidth />} />
          <form.Field name="bio" validators={{ onChange: ({ value }) => value.length > 200 ? t("profile.bioMaxLength", { max: 200 }) : undefined }} children={(field) => <TextField label={t("profile.bio")} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} multiline minRows={3} error={!!field.state.meta.errors.length} helperText={field.state.meta.errors.join(", ")} fullWidth />} />
          <Button variant="contained" size="small" type="submit" disabled={updateUserInfo.mutation.isPending} sx={{ alignSelf: "flex-start", mt: 1, width: "fit-content" }}>
            {updateUserInfo.mutation.isPending ? t("common.updating") : t("common.update")}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};
