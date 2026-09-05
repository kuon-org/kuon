import { Container, Typography, Stack, Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useArticles } from "../../hooks/useArticles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";

const Trends = () => {
  const { t } = useTranslation("articles");
  const { trendArticles, trendArticlesIsLoading, trendArticlesIsError, trendArticlesHasNextPage, trendArticlesIsFetchingNextPage, trendArticlesFetchNextPage } = useArticles();
  if (trendArticlesIsLoading) return <Container sx={{ mt: 5 }}><Typography variant="subtitle2" gutterBottom>{t("feed.trends")}</Typography><Stack spacing={2}>{[...Array(5)].map((_, i) => <ArticlesSkeleton key={i} />)}</Stack></Container>;
  if (trendArticlesIsError) return <Container sx={{ textAlign: "center", mt: 5 }}><Typography color="error">{t("feed.loadFailed")}</Typography></Container>;
  return <Container sx={{ mt: 5 }}><Typography variant="subtitle2" gutterBottom>{t("feed.trends")}</Typography>{!trendArticles || trendArticles.length === 0 ? <Typography>{t("feed.empty")}</Typography> : <Stack spacing={{ sm: 0, md: 2 }}>{trendArticles.map((article) => <ArticleCard key={article.id} article={article} />)}{trendArticlesIsFetchingNextPage && <Stack spacing={2} sx={{ mt: 2 }}>{[...Array(3)].map((_, i) => <ArticlesSkeleton key={i} />)}</Stack>}</Stack>}{trendArticlesHasNextPage && <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}><Button variant="outlined" onClick={() => trendArticlesFetchNextPage()} disabled={trendArticlesIsFetchingNextPage} sx={{ borderRadius: 10, px: 4 }}>{trendArticlesIsFetchingNextPage ? t("feed.loadingMore") : t("feed.loadMore")}</Button></Box>}</Container>;
};

export default Trends;
