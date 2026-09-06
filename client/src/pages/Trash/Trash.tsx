import { Container, Paper, Typography, List, ListItem, ListItemText, Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  useHardDeleteArticle,
  useRestoreArticle,
  useTrashArticlesQuery,
} from "../../hooks/articles";

export const Trash = () => {
  const { t, i18n } = useTranslation("articles");
  const trashQuery = useTrashArticlesQuery();
  const restoreArticle = useRestoreArticle();
  const hardDeleteArticle = useHardDeleteArticle();
  const articles = trashQuery.data ?? [];

  return (
    <Container sx={{ mt: 4 }} maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>{t("trash.title")}</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>{t("trash.description")}</Typography>
        <List>
          {trashQuery.isLoading ? (
            <ListItem><ListItemText primary={t("trash.loading")} /></ListItem>
          ) : (
            articles.map((article) => (
              <ListItem key={article.id} divider>
                <ListItemText
                  primary={article.title || t("trash.untitled")}
                  secondary={t("trash.deletedAt", { date: new Date(article.updated_at).toLocaleString(i18n.language) })}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="contained" color="success" onClick={() => restoreArticle.mutate(article.id)}>{t("trash.restore")}</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => { if (window.confirm(t("trash.hardDeleteConfirm"))) hardDeleteArticle.mutate(article.id); }}>{t("trash.hardDelete")}</Button>
                </Box>
              </ListItem>
            ))
          )}
          {!trashQuery.isLoading && articles.length === 0 && <Typography textAlign="center" py={4}>{t("trash.empty")}</Typography>}
        </List>
      </Paper>
    </Container>
  );
};
