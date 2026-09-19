import { Container, Typography, Stack, Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTrendArticlesInfiniteQuery } from "../../hooks/articles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";

const Trends = () => {
  const { t } = useTranslation("articles");
  const trendsQuery = useTrendArticlesInfiniteQuery();
  const trendArticles =
    trendsQuery.data?.pages.flatMap((page) => page.articles) ?? [];
  if (trendsQuery.isLoading)
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("feed.trends")}
        </Typography>
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      </Container>
    );
  if (trendsQuery.isError)
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Typography color="error">{t("feed.loadFailed")}</Typography>
      </Container>
    );
  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="subtitle2" gutterBottom>
        {t("feed.trends")}
      </Typography>
      {trendArticles.length === 0 ? (
        <Typography>{t("feed.empty")}</Typography>
      ) : (
        <Stack spacing={{ sm: 0, md: 2 }}>
          {trendArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {trendsQuery.isFetchingNextPage && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {[...Array(3)].map((_, i) => (
                <ArticlesSkeleton key={i} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
      {trendsQuery.hasNextPage && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            onClick={() => trendsQuery.fetchNextPage()}
            disabled={trendsQuery.isFetchingNextPage}
            sx={{ borderRadius: 10, px: 4 }}
          >
            {trendsQuery.isFetchingNextPage
              ? t("feed.loadingMore")
              : t("feed.loadMore")}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Trends;
