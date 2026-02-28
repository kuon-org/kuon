import { Container, Typography, Stack, Box, Button } from "@mui/material";
import { useArticles } from "../../hooks/useArticles";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { ArticleCard } from "../../components/Article/ArticleCard";

const Home = () => {
  const {
    articles,
    articles_isLoading: isLoading,
    articles_isError: isError,
    hasNextPage, // 追加
    isFetchingNextPage, // 追加
    fetchNextPage, // 追加
  } = useArticles();

  if (isLoading) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="h4" gutterBottom>
          最新記事
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
      <Typography variant="h4" gutterBottom>
        最新記事
      </Typography>

      {!articles || articles.length === 0 ? (
        <Typography>記事がありません</Typography>
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
