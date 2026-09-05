import { Container, Typography, Stack, Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useArticles } from "../../hooks/useArticles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";

const Timeline = () => {
  const { t } = useTranslation("articles");
  const { articles, articles_isLoading: isLoading, articles_isError: isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useArticles();
  if (isLoading) return <Container sx={{ mt: 5 }}><Typography variant="subtitle2" gutterBottom>{t("feed.timeline")}</Typography><Stack spacing={2}>{[...Array(5)].map((_, i) => <ArticlesSkeleton key={i} />)}</Stack></Container>;
  if (isError) return <Container sx={{ textAlign: "center", mt: 5 }}><Typography color="error">{t("feed.loadFailed")}</Typography></Container>;
  return <Container sx={{ mt: 5 }}><Typography variant="subtitle2" gutterBottom>{t("feed.timeline")}</Typography>{!articles || articles.length === 0 ? <Typography>{t("feed.empty")}</Typography> : <Stack spacing={{ sm: 0, md: 2 }}>{articles.map((article) => <ArticleCard key={article.id} article={article} />)}{isFetchingNextPage && <Stack spacing={2} sx={{ mt: 2 }}>{[...Array(3)].map((_, i) => <ArticlesSkeleton key={i} />)}</Stack>}</Stack>}{hasNextPage && <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}><Button variant="outlined" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} sx={{ borderRadius: 10, px: 4 }}>{isFetchingNextPage ? t("feed.loadingMore") : t("feed.loadMore")}</Button></Box>}</Container>;
};

export default Timeline;
