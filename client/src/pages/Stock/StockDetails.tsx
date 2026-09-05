import { Box, Typography, Stack, CircularProgress, Pagination, PaginationItem } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useStocks } from "../../hooks/useStocks";
import { ArticleCard } from "../../components/Article/ArticleCard";
import { StockSearchBar } from "../../components/Search/StockSearchBar";
import { stockEditRoute } from "../../routes";

export const StockDetail = () => {
  const { t } = useTranslation("articles");
  const { listId, username } = useParams({ strict: false });
  const { q, page = 1 } = useSearch({ strict: false }) as { q?: string; page?: number };
  const { listDetail, isDetailLoading } = useStocks(undefined, listId, page, q);
  const showSettings = listDetail?.id !== "all" && !Boolean(username);
  if (isDetailLoading) return <CircularProgress />;
  if (!listDetail) return <Typography>{t("stock.notFound")}</Typography>;
  return <Box><Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography variant="h5" fontWeight="bold">{listDetail.name}</Typography>{showSettings && <Link to={stockEditRoute.to} params={{ listId: listDetail.id }} style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}><SettingsIcon sx={{ mr: 1 }} /><Typography variant="body2" color="primary">{t("stock.settings")}</Typography></Link>}</Box><Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 3, width: "100%", flexWrap: "wrap", gap: 2 }}><StockSearchBar initialValue={q} /></Box>{q && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("stock.searchResult", { query: q })}</Typography>}<Stack>{listDetail.stock_items.map((item) => <ArticleCard key={item.id} article={item.articles} />)}</Stack>{listDetail.pagination && listDetail.pagination.totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", mt: 6, mb: 4 }}><Pagination count={listDetail.pagination.totalPages} page={page} variant="outlined" shape="rounded" renderItem={(item) => item.disabled ? <PaginationItem {...item} /> : <Link from={username ? "/$username/stocks/$listId" : listId ? "/stocks/$listId" : "/stocks"} search={(prev: any) => ({ ...prev, page: item.page })} style={{ textDecoration: "none" }}><PaginationItem {...item} /></Link>} /></Box>}</Box>;
};
