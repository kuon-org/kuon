import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useStocks } from "../../hooks/useStocks";
import { StockListCard } from "../../components/Stock/StockListCard";

export const PublicStocksPage = () => {
  const {
    publicLists,
    publicLists_isLoading,
    publicLists_hasNextPage: hasNextPage,
    publicLists_fetchNextPage: fetchNextPage,
    publicLists_isFetchingNextPage: isFetchingNextPage,
  } = useStocks();

  if (publicLists_isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ mt: 5, mb: 10 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold" }}>
        新着ストックリスト
      </Typography>

      <Stack spacing={0}>
        {publicLists.map((list) => (
          <StockListCard key={list.id} list={list} />
        ))}
      </Stack>

      {hasNextPage && (
        <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            sx={{ minWidth: 200 }}
          >
            {isFetchingNextPage ? "読み込み中..." : "もっと見る"}
          </Button>
        </Box>
      )}

      {!hasNextPage && publicLists.length > 0 && (
        <Typography align="center" color="text.secondary" sx={{ mt: 6 }}>
          すべてのリストを表示しました
        </Typography>
      )}
    </Container>
  );
};
