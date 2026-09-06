import { useCallback, useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Typography,
  AppBar,
  Toolbar,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from "@mui/material";
import { type UseMutateAsyncFunction } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import MarkdownEditor from "./Experimental/MarkdownEditor";
import { type Article } from "../../hooks/articles";
import { useTagsQuery } from "../../hooks/useTags";
import { useKey } from "../../hooks/useKey";
import { useNotify } from "../../hooks/useNotify";
import { draftsRoute } from "../../routes";
import { ConfirmLeaveDialog } from "../common/ConfirmLeaveDialog";
import { getPublishWebhookPreference, PublishWebhookSettings } from "./PublishWebhookSettings";
import { useAuthUserQuery } from "../../hooks/auth";
import { useMyPermissionsQuery } from "../../hooks/roles";

interface ArticleEditorProps {
  mutate: UseMutateAsyncFunction<any, any, any, unknown>;
  isFetching: boolean;
  article?: Article;
}

export default function ArticleEditor({ mutate, isFetching, article }: ArticleEditorProps) {
  const { t } = useTranslation(["articles", "errors"]);
  const router = useRouter();
  const navigate = useNavigate();
  const { error, success } = useNotify();
  const authUserQuery = useAuthUserQuery();
  const permissionsQuery = useMyPermissionsQuery(!!authUserQuery.data);
  const permissions = permissionsQuery.data?.permissions ?? [];
  const canCreateTag = permissions.includes("tag.create") || permissions.includes("tag.manage");

  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [text, setText] = useState(article?.raw_content ?? "");
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
  const [isEdited, setIsEdited] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { tags, upsertTag } = useTagsQuery();
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(article?.article_tags?.map((item) => item.tags.name) ?? []);
  const [isPrivate, setIsPrivate] = useState(article?.is_private ?? false);

  const getVisibilityValue = () => {
    if (isPrivate) return "private";
    if (isPublished) return "public";
    return "unlisted";
  };

  const handleVisibilityChange = (value: string) => {
    if (value === "public") {
      setIsPublished(true);
      setIsPrivate(false);
    } else if (value === "unlisted") {
      setIsPublished(false);
      setIsPrivate(false);
    } else {
      setIsPublished(true);
      setIsPrivate(true);
    }
  };

  const handleSave = useCallback(
    async (mode: "draft" | "public") => {
      try {
        const tagIds = await Promise.all(selectedTagNames.map(async (name) => {
          const existingTag = tags.find((tag) => tag.name === name);
          if (existingTag) return existingTag.id;
          if (!canCreateTag) throw new Error("TagCreatePermissionDenied");
          const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
          const createdTag = await upsertTag({ name, slug });
          return createdTag.id;
        }));
        const webhookPreference = getPublishWebhookPreference();
        const shouldNotifyWebhooks = mode === "public" && isPublished && !isPrivate && webhookPreference.notify && webhookPreference.webhookIds.length > 0;

        await mutate(
          {
            title,
            raw_content: text,
            summary,
            status: mode,
            is_published: isPublished,
            is_private: isPrivate,
            tagIds,
            notify_webhooks: shouldNotifyWebhooks,
            webhook_ids: shouldNotifyWebhooks ? webhookPreference.webhookIds : [],
          },
          {
            onSuccess: () => {
              if (mode === "draft") success(t("editor.draftSaved", { ns: "articles" }));
              if (mode === "public") success(t("editor.published", { ns: "articles" }));
              setIsDialogOpen(false);
              setIsEdited(false);
            },
            onError: () => error(t("editor.saveFailed", { ns: "articles" })),
          },
        );
        setIsDialogOpen(false);
      } catch (err) {
        console.error("Failed to save article:", err);
        if (err instanceof Error && err.message === "TagCreatePermissionDenied") {
          error(t("editor.noTagCreatePermission", { ns: "articles" }));
          return;
        }
        error(t("UNKNOWN_ERROR", { ns: "errors" }));
      }
    },
    [title, text, summary, isPublished, isPrivate, selectedTagNames, mutate, tags, canCreateTag, upsertTag, success, error, t],
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back();
      return;
    }
    navigate({ to: "/" });
  };

  useKey("s", async () => {
    if (article) {
      if (isDialogOpen) {
        await handleSave("public");
        navigate({ to: draftsRoute.to });
      } else if (!isEdited) return setIsDialogOpen(true);
      else await handleSave("draft");
    } else if (isDialogOpen) {
      await handleSave("public");
      navigate({ to: "/" });
    } else {
      setIsDialogOpen(true);
    }
  }, { ctrlKey: true, preventDefault: true });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <AppBar position="relative" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">{t("editor.title", { ns: "articles" })}</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" color="secondary" onClick={isEdited ? () => setIsConfirmDialogOpen(true) : handleBack}>{isEdited ? t("editor.cancel", { ns: "articles" }) : t("editor.close", { ns: "articles" })}</Button>
            <Button variant="outlined" onClick={() => handleSave("draft")} disabled={isFetching}>{t("editor.saveDraft", { ns: "articles" })}</Button>
            <Button variant="contained" color="secondary" onClick={() => setIsDialogOpen(true)} disabled={!text.trim()}>{t("editor.publishSettings", { ns: "articles" })}</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, py: 1, px: { md: 3 }, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <TextField fullWidth label={t("editor.titleField", { ns: "articles" })} variant="standard" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2, "& .MuiInputBase-root": { fontSize: "1.5rem", fontWeight: "bold" } }} />
        <Autocomplete multiple freeSolo={canCreateTag} options={tags?.map((tag) => tag.name) || []} value={selectedTagNames} onChange={(_event, newValue) => setSelectedTagNames(newValue)} renderTags={(value, getTagProps) => value.map((option, index) => <Chip label={option} {...getTagProps({ index })} key={index} variant="outlined" size="small" />)} renderInput={(params) => <TextField {...params} label={t("editor.tags", { ns: "articles" })} placeholder={canCreateTag ? t("editor.tagPlaceholder", { ns: "articles" }) : t("editor.selectExistingTag", { ns: "articles" })} variant="standard" sx={{ mb: 2 }} helperText={canCreateTag ? undefined : t("editor.noTagCreatePermission", { ns: "articles" })} />} />
        <TextField fullWidth label={t("editor.summary", { ns: "articles" })} multiline maxRows={3} variant="standard" value={summary} onChange={(e) => setSummary(e.target.value)} sx={{ mb: 2 }} />
        <MarkdownEditor text={text} setText={setText} setIsEdited={setIsEdited} />
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("editor.settingsTitle", { ns: "articles" })}</DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1 }}>{t("editor.visibilityTitle", { ns: "articles" })}</FormLabel>
            <RadioGroup value={getVisibilityValue()} onChange={(e) => handleVisibilityChange(e.target.value)}>
              <FormControlLabel value="public" control={<Radio />} label={t("editor.public", { ns: "articles" })} />
              <FormControlLabel value="unlisted" control={<Radio />} label={t("editor.unlisted", { ns: "articles" })} />
              <FormControlLabel value="private" control={<Radio />} label={t("editor.private", { ns: "articles" })} />
            </RadioGroup>
          </FormControl>
          <PublishWebhookSettings disabled={isPrivate || !isPublished} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">{t("editor.back", { ns: "articles" })}</Button>
          <Button variant="contained" color="secondary" onClick={() => handleSave("public")} disabled={isFetching || !title.trim()}>
            {isFetching ? t("editor.sending", { ns: "articles" }) : isPrivate ? t("editor.savePrivate", { ns: "articles" }) : isPublished ? t("editor.savePublic", { ns: "articles" }) : t("editor.saveUnlisted", { ns: "articles" })}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmLeaveDialog open={isConfirmDialogOpen} onClose={() => setIsConfirmDialogOpen(false)} />
    </Box>
  );
}
