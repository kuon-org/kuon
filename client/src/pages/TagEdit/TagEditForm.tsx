import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import { type UpsertTagData } from "../../hooks/tags";
import { useForm } from "@tanstack/react-form";
import { Avatar, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNotify } from "../../hooks/useNotify";
import { useRouter } from "@tanstack/react-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
interface TagEditFormProps {
  mutate: UseMutateAsyncFunction<any, any, UpsertTagData, unknown>;
  uploadImage: UseMutateAsyncFunction<any, any, File, unknown>;
  isPending: boolean;
  oldTag: UpsertTagData;
}
export const TagEditForm = ({ mutate, uploadImage, isPending, oldTag }: TagEditFormProps) => {
  const { t } = useTranslation("tags");
  const { notify } = useNotify();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resUrl, setResUrl] = useState<string | null>(oldTag.avatar_url || null);
  const form = useForm({
    defaultValues: { name: oldTag.name ?? "", slug: oldTag.slug ?? "", description: oldTag.description ?? "" },
    onSubmit: async ({ value }) => {
      const data = { ...value, avatar_url: resUrl };
      await mutate(data, { onSuccess: () => { notify(t("edit.success")); router.history.back(); } });
    },
  });
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const data = await uploadImage(file);
        setResUrl(data.url);
      } catch {
        notify(t("edit.uploadError"));
      }
    }
  };

  return (
    <Paper sx={{ mx: "auto", flex: 1, p: 3, minWidth: { xs: "100%", sm: "100%", md: "600px", lg: "850px" } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{t("edit.title", { name: oldTag.name })}</Typography>
      <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
        <Stack spacing={2}>
          <form.Field name="name" children={(field) => <TextField label={t("edit.displayName")} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} fullWidth />} />
          <form.Field name="slug" children={(field) => <TextField label={t("edit.slug")} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} fullWidth />} />
          <Box onClick={() => fileInputRef.current?.click()} sx={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
            <Avatar src={resUrl || undefined} alt="tagAvatar" sx={{ width: "48px", height: "48px", bgcolor: "grey.200", border: "1px solid", borderColor: "divider" }} />
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
            <Typography>{t("edit.uploadIcon")}</Typography>
          </Box>
          <form.Field name="description" children={(field) => <TextField label={t("edit.description")} multiline minRows={3} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} fullWidth />} />
          <Button variant="contained" size="small" type="submit" disabled={isPending} sx={{ alignSelf: "flex-start", mt: 1, width: "fit-content" }}>
            {isPending ? t("edit.updating") : t("edit.update")}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};
