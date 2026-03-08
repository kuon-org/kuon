import { Container, Typography, Stack, Box, Button } from "@mui/material";
import { useArticles } from "../../hooks/useArticles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";

const Trends = () => {
  const {
    trendArticles,
    trendArticlesIsLoading,
    trendArticlesIsError,
    trendArticlesHasNextPage, // 追加
    trendArticlesIsFetchingNextPage, // 追加
    trendArticlesFetchNextPage, // 追加
  } = useArticles();

  if (trendArticlesIsLoading) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="h4" gutterBottom>
          トレンド記事
        </Typography>
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      </Container>
    );
  }

  if (trendArticlesIsError) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Typography color="error">記事の取得に失敗しました</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        トレンド記事
      </Typography>

      {!trendArticles || trendArticles.length === 0 ? (
        <Typography>記事がありません</Typography>
      ) : (
        <Stack spacing={{ sm: 0, md: 2 }}>
          {trendArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {trendArticlesIsFetchingNextPage && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {[...Array(3)].map((_, i) => (
                <ArticlesSkeleton key={i} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
      {trendArticlesHasNextPage && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            onClick={() => trendArticlesFetchNextPage()}
            disabled={trendArticlesIsFetchingNextPage}
            sx={{ borderRadius: 10, px: 4 }}
          >
            {trendArticlesIsFetchingNextPage
              ? "読み込み中..."
              : "もっと読み込む"}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Trends;
