import { Container, Typography, Stack, Box, Button, Grid } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  useRecommendedArticlesInfiniteQuery,
  useTrendArticlesInfiniteQuery,
} from "../../hooks/articles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";

const Home = () => {
  const { t } = useTranslation("articles");
  const trendsQuery = useTrendArticlesInfiniteQuery();
  const recommendsQuery = useRecommendedArticlesInfiniteQuery();
  const trendArticles =
    trendsQuery.data?.pages.flatMap((page) => page.articles) ?? [];
  const articles =
    recommendsQuery.data?.pages.flatMap((page) => page.articles) ?? [];
  if (recommendsQuery.isLoading)
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("feed.recommended")}
        </Typography>
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      </Container>
    );
  if (recommendsQuery.isError)
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Typography color="error">{t("feed.loadFailed")}</Typography>
      </Container>
    );
  return (
    <Container sx={{ mt: 5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("feed.trendingArticles")}
        </Typography>
        <Link to="/trend" style={{ textDecoration: "none", color: "inherit" }}>
          {t("feed.viewTrends")}
        </Link>
      </Box>
      {trendsQuery.isLoading ? (
        <Stack direction="row" spacing={2}>
          {[...Array(3)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      ) : (
        <Grid container spacing={2} alignItems="stretch">
          {trendArticles.slice(0, 3).map((article) => (
            <Grid size={{ xs: 12, md: 4 }} key={article.id}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>
      )}
      <Typography variant="subtitle2" gutterBottom mt={2}>
        {t("feed.recommended")}
      </Typography>
      {articles.length === 0 ? (
        <Typography>{t("feed.recommendationHint")}</Typography>
      ) : (
        <Stack spacing={{ sm: 0, md: 2 }}>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {recommendsQuery.isFetchingNextPage && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {[...Array(3)].map((_, i) => (
                <ArticlesSkeleton key={i} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
      {recommendsQuery.hasNextPage && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            onClick={() => recommendsQuery.fetchNextPage()}
            disabled={recommendsQuery.isFetchingNextPage}
            sx={{ borderRadius: 10, px: 4 }}
          >
            {recommendsQuery.isFetchingNextPage
              ? t("feed.loadingMore")
              : t("feed.loadMore")}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Home;
