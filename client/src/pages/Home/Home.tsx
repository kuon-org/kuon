import { Container, Typography, Stack, Box, Button, Grid } from "@mui/material";
import { useArticles } from "../../hooks/useArticles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";
import { Link } from "@tanstack/react-router";

const Home = () => {
  const {
    trendArticles,
    trendArticlesIsLoading,
    recommendArticles: articles,
    recommendArticlesIsLoading: isLoading,
    recommendArticlesIsError: isError,
    recommendArticlesHasNextPage: hasNextPage, // 追加
    recommendArticlesFetchingNextPage: isFetchingNextPage, // 追加
    recommendArticlesFetchNextPage: fetchNextPage, // 追加
  } = useArticles();

  if (isLoading) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="subtitle2" gutterBottom>
          おすすめの記事
        </Typography>
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Typography color="error">記事の取得に失敗しました</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" gutterBottom>
          トレンドの記事
        </Typography>
        <Link to="/trend" style={{ textDecoration: "none", color: "inherit" }}>
          トレンド一覧を見る
        </Link>
      </Box>
      {trendArticlesIsLoading ? (
        <Stack direction="row" spacing={2}>
          {[...Array(3)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      ) : (
        <Grid container spacing={2} alignItems="stretch">
          {trendArticles?.slice(0, 3).map((article) => (
            <Grid size={{ xs: 12, md: 4 }} key={article.id}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>
      )}
      <Typography variant="subtitle2" gutterBottom mt={2}>
        おすすめの記事
      </Typography>

      {!articles || articles.length === 0 ? (
        <Typography>
          タグのフォローや記事のいいねをするとここに記事が表示されます
        </Typography>
      ) : (
        <Stack spacing={{ sm: 0, md: 2 }}>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {isFetchingNextPage && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {[...Array(3)].map((_, i) => (
                <ArticlesSkeleton key={i} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
      {hasNextPage && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            sx={{ borderRadius: 10, px: 4 }}
          >
            {isFetchingNextPage ? "読み込み中..." : "もっと読み込む"}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Home;
