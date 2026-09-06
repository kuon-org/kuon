import { Container, Typography, Stack, Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useArticlesInfiniteQuery } from "../../hooks/articles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";

const Timeline = () => {
  const { t } = useTranslation("articles");
  const articlesQuery = useArticlesInfiniteQuery();
  const articles = articlesQuery.data?.pages.flatMap((page) => page.articles) ?? [];
  if (articlesQuery.isLoading) return <Container sx={{ mt: 5 }}><Typography variant="subtitle2" gutterBottom>{t("feed.timeline")}</Typography><Stack spacing={2}>{[...Array(5)].map((_, i) => <ArticlesSkeleton key={i} />)}</Stack></Container>;
  if (articlesQuery.isError) return <Container sx={{ textAlign: "center", mt: 5 }}><Typography color="error">{t("feed.loadFailed")}</Typography></Container>;
  return <Container sx={{ mt: 5 }}><Typography variant="subtitle2" gutterBottom>{t("feed.timeline")}</Typography>{articles.length === 0 ? <Typography>{t("feed.empty")}</Typography> : <Stack spacing={{ sm: 0, md: 2 }}>{articles.map((article) => <ArticleCard key={article.id} article={article} />)}{articlesQuery.isFetchingNextPage && <Stack spacing={2} sx={{ mt: 2 }}>{[...Array(3)].map((_, i) => <ArticlesSkeleton key={i} />)}</Stack>}</Stack>}{articlesQuery.hasNextPage && <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}><Button variant="outlined" onClick={() => articlesQuery.fetchNextPage()} disabled={articlesQuery.isFetchingNextPage} sx={{ borderRadius: 10, px: 4 }}>{articlesQuery.isFetchingNextPage ? t("feed.loadingMore") : t("feed.loadMore")}</Button></Box>}</Container>;
};

export default Timeline;
