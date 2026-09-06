import { useState, useRef } from "react";
import { Box, Button, Stack, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import FastEditor, { type FastEditorRef } from "../../Editor/FastEditor";
import { useCreateComment } from "../../../hooks/comments";
import { useAuthQuery } from "../../../hooks/useAuth";
import { NavButton } from "../../common/NavButton";

interface CommentEditorProps {
  articleId: string;
  parentCommentId?: string | null;
  onSuccess?: () => void;
  placeholder?: string;
}

export const CommentEditor = ({
  articleId,
  parentCommentId = null,
  onSuccess,
  placeholder,
}: CommentEditorProps) => {
  const { t } = useTranslation("comments");
  const [content, setContent] = useState("");
  const editorRef = useRef<FastEditorRef>(null);
  const createComment = useCreateComment(articleId);
  const { user } = useAuthQuery();
  const resolvedPlaceholder = placeholder ?? t("editor.placeholder");

  if (!user) {
    return (
      <Paper sx={{ bgcolor: "background.default", mx: "auto", py: 2, width: "70%", gap: 2, display: "flex", flexDirection: "column", textAlign: "center" }}>
        <Typography variant="body1">{t("editor.loginPrompt")}</Typography>
        <Box sx={{ display: "flex", mx: "auto" }}>
          <NavButton path="/login" message={t("editor.login")} variant="outlined" />
          <NavButton path="/register" message={t("editor.register")} variant="contained" />
        </Box>
      </Paper>
    );
  }

  const handlePost = () => {
    if (!content.trim()) return;

    createComment.mutate(
      { body: content, parent_comment_id: parentCommentId },
      {
        onSuccess: () => {
          setContent("");
          editorRef.current?.setValue("");
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        "&:focus-within": { borderColor: "primary.main" },
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            minHeight: "80px",
            maxHeight: "300px",
            overflow: "hidden",
            position: "relative",
            borderBottom: "1px solid",
            borderColor: "divider",
            mb: 1,
            "& [data-placeholder]:empty:before": {
              content: "attr(data-placeholder)",
              color: "text.disabled",
              cursor: "text",
            },
          }}
        >
          <FastEditor ref={editorRef} value={content} onChange={setContent} placeholder={resolvedPlaceholder} />
        </Box>
        <Stack direction="row" justifyContent="flex-end" alignItems="center">
          <Button
            variant="contained"
            disabled={!content.trim() || createComment.isPending}
            onClick={handlePost}
            sx={{ borderRadius: "20px", px: 3, textTransform: "none", fontWeight: "bold" }}
          >
            {createComment.isPending ? t("editor.sending") : parentCommentId ? t("editor.reply") : t("editor.submit")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
