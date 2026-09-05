import { Container, Paper, Typography, FormControlLabel, List, ListItem, ListItemText, ListItemButton, Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AntSwitch } from "../../components/common/AntSwitch";
import { useArticles } from "../../hooks/useArticles";
import MarkdownRenderer from "../../components/Markdown/MarkdownRenderer";
import { TagChip } from "../../components/common/TagChip";

export const Drafts = () => {
  const { t, i18n } = useTranslation("articles");
  const [showUnpublishedOnly, setShowUnpublishedOnly] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const { userArticles, userArticles_isLoading, rollbackArticle, deleteArticle } = useArticles();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const articles = userArticles ?? [];
  const filteredDrafts = showUnpublishedOnly ? articles.filter((article) => !article.is_published) : articles;
  const selectedArticle = filteredDrafts.find((article) => article.id === selectedArticleId);
  const handleRollback = (id: string, title: string) => { if (window.confirm(t("drafts.rollbackConfirm", { title }))) rollbackArticle(id); };
  const handleDelete = (id: string, title: string) => { if (window.confirm(t("drafts.deleteConfirm", { title }))) deleteArticle(id); };

  return <Container sx={{ mt: 4, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 4, md: 3 }, alignItems: { xs: "center", md: "flex-start" } }}><Paper sx={{ width: { xs: "100%", sm: "450px" }, maxWidth: { xs: "100%", sm: "450px" }, height: "fit-content", maxHeight: "80vh", overflowY: "hidden", display: "flex", alignSelf: "flex-start", position: "sticky", flexDirection: "column", top: "120px", p: 2 }}><Typography variant="subtitle1" mb={2}>{t("drafts.title")}</Typography><FormControlLabel control={<AntSwitch checked={showUnpublishedOnly} onChange={() => setShowUnpublishedOnly(!showUnpublishedOnly)} />} label={t("drafts.unpublishedOnly")} /><List sx={{ mt: 2, overflowY: "scroll" }}>{userArticles_isLoading ? <ListItem><ListItemText primary={t("status.loading")} /></ListItem> : filteredDrafts.map((article) => { const hasDraftDiff = article.is_published && article.status === "draft"; return <ListItemButton key={article.id} divider selected={article.id === selectedArticleId} onClick={() => isSmall ? navigate({ to: "/drafts/$articleId/edit", params: { articleId: article.id } }) : setSelectedArticleId(article.id)} sx={{ flexDirection: "column", alignItems: "flex-start", py: 1.5 }}><Box sx={{ display: "flex", gap: 1, width: "100%", mb: 0.5 }}><Typography variant="caption" color="text.secondary">{article.is_published && t("drafts.published")}</Typography><Typography variant="caption" color="text.secondary">{t("drafts.updatedAt", { date: new Date(article.updated_at).toLocaleString(i18n.language) })}</Typography></Box><ListItemText primary={article.title.trim() ? article.title : t("drafts.untitled")} secondary={article.raw_content.trim() ? article.raw_content.substring(0, 50) + (article.raw_content.length > 50 ? "..." : "") : t("drafts.emptyBody")} /><Box sx={{ display: "flex", gap: 1, width: "100%", mb: 0.5 }}><Link to="/drafts/$articleId/edit" params={{ articleId: article.id }}><Button variant="outlined" onClick={(e) => e.stopPropagation()}>{t("drafts.edit")}</Button></Link>{hasDraftDiff && <Button variant="outlined" color="error" onClick={(e) => { e.stopPropagation(); handleRollback(article.id, article.title); }}>{t("drafts.rollback")}</Button>}<Button variant="outlined" color="error" size="small" onClick={(e) => { e.stopPropagation(); handleDelete(article.id, article.title); }}>{t("drafts.delete")}</Button></Box></ListItemButton>; })}{!userArticles_isLoading && filteredDrafts.length === 0 && <ListItem><ListItemText primary={t("drafts.empty")} /></ListItem>}</List></Paper><Paper sx={{ mx: "auto", flex: 1, p: 2, display: { xs: "none", sm: "none", md: "block" }, width: { md: "450px", lg: "600px", xl: "750px" }, maxWidth: { md: "450px", lg: "600px", xl: "750px" } }}><Box sx={{ display: "flex", flexDirection: "column", mt: 2, mb: 2 }}>{selectedArticle?.title.trim() ? <Typography variant="h4">{selectedArticle.title}</Typography> : <Typography variant="h4" color="textDisabled">{t("drafts.untitled")}</Typography>}<Box mt={1} mb={1} display="flex" gap={1} flexWrap="wrap">{selectedArticle?.article_tags.map((tagItem) => <TagChip key={tagItem.tags.id} tag={tagItem.tags} />)}</Box></Box><MarkdownRenderer text={selectedArticle?.raw_content ?? ""} /></Paper></Container>;
};
