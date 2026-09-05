import { Container, Typography, Box, Button, CircularProgress, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useStocks } from "../../hooks/useStocks";
import { StockListCard } from "../../components/Stock/StockListCard";

export const PublicStocksPage = () => {
  const { t } = useTranslation("articles");
  const { publicLists, publicLists_isLoading, publicLists_hasNextPage: hasNextPage, publicLists_fetchNextPage: fetchNextPage, publicLists_isFetchingNextPage: isFetchingNextPage } = useStocks();
  if (publicLists_isLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  return <Container sx={{ mt: 5, mb: 10 }}><Typography variant="subtitle2" sx={{ mb: 4, fontWeight: "bold" }}>{t("stock.latest")}</Typography><Stack spacing={0}>{publicLists.map((list) => <StockListCard key={list.id} list={list} />)}</Stack>{hasNextPage && <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}><Button variant="outlined" size="large" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} sx={{ minWidth: 200 }}>{isFetchingNextPage ? t("status.loading") : t("stock.loadMore")}</Button></Box>}{!hasNextPage && publicLists.length > 0 && <Typography align="center" color="text.secondary" sx={{ mt: 6 }}>{t("stock.allLoaded")}</Typography>}</Container>;
};
