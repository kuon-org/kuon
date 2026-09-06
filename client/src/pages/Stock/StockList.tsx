import { Container, Typography, Box, Button, CircularProgress, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { usePublicStockLists } from "../../hooks/stocks";
import { StockListCard } from "../../components/Stock/StockListCard";

export const PublicStocksPage = () => {
  const { t } = useTranslation("articles");
  const publicLists = usePublicStockLists();
  const lists = publicLists.data?.pages.flatMap((page) => page.lists) ?? [];

  if (publicLists.isLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  return <Container sx={{ mt: 5, mb: 10 }}><Typography variant="subtitle2" sx={{ mb: 4, fontWeight: "bold" }}>{t("stock.latest")}</Typography><Stack spacing={0}>{lists.map((list) => <StockListCard key={list.id} list={list} />)}</Stack>{publicLists.hasNextPage && <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}><Button variant="outlined" size="large" onClick={() => publicLists.fetchNextPage()} disabled={publicLists.isFetchingNextPage} sx={{ minWidth: 200 }}>{publicLists.isFetchingNextPage ? t("status.loading") : t("stock.loadMore")}</Button></Box>}{!publicLists.hasNextPage && lists.length > 0 && <Typography align="center" color="text.secondary" sx={{ mt: 6 }}>{t("stock.allLoaded")}</Typography>}</Container>;
};
