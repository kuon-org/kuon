import { Box, Divider, Typography, Stack, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CommentCard } from "./CommentCard";
import { useCommentsQuery } from "../../../hooks/comments";
import { CommentEditor } from "./CommentEditor";

interface CommentProps {
  articleId: string;
}

export const Comment = ({ articleId }: CommentProps) => {
  const { t } = useTranslation("comments");
  const commentsQuery = useCommentsQuery(articleId);
  const comments = commentsQuery.data ?? [];

  if (commentsQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (commentsQuery.isError) {
    return <Typography color="error">{t("list.loadFailed")}</Typography>;
  }

  return (
    <Box
      id={`${articleId}-comment`}
      sx={{
        display: "flex",
        flexDirection: "column",
        px: { xs: 2, md: 6 },
        py: 4,
        borderRadius: 2,
        boxShadow: 1,
        gap: 2,
      }}
    >
      <Typography variant="h6">{t("list.title", { count: comments.length })}</Typography>
      <Divider />
      <Stack spacing={1} sx={{ mt: 2 }}>
        {comments.length > 0 ? (
          comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("list.empty")}
          </Typography>
        )}
      </Stack>
      <CommentEditor articleId={articleId} />
    </Box>
  );
};
