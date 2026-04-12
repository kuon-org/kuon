import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Pagination,
  PaginationItem,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { useStocks } from "../../hooks/useStocks";
import { ArticleCard } from "../../components/Article/ArticleCard";
import { StockSearchBar } from "../../components/Search/StockSearchBar";
import { stockEditRoute } from "../../routes";

export const StockDetail = () => {
  const { listId, username } = useParams({ strict: false });

  // URLの ?page=1 を取得 (SearchPage.tsx と同じ方式)
  const { q, page = 1 } = useSearch({ strict: false }) as {
    q?: string;
    page?: number;
  };
  const { listDetail, isDetailLoading } = useStocks(undefined, listId, page, q);

  // 1. listDetail.id === "all" の場合
  // 2. /stocks/$username/... 系のルート（userStockIndexRoute）から呼ばれている場合
  // このいずれかなら編集ボタンを隠す
  const isUserStockView = Boolean(username);
  const isAllList = listDetail?.id === "all";
  const showSettings = !isAllList && !isUserStockView;
  if (isDetailLoading) return <CircularProgress />;
  if (!listDetail) return <Typography>リストが見つかりません</Typography>;
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5" fontWeight="bold">
          {listDetail.name}
        </Typography>
        {showSettings && (
          <Link
            to={stockEditRoute.to}
            params={{ listId: listDetail.id }}
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <SettingsIcon sx={{ mr: 1 }} />
            <Typography variant="body2" color="primary">
              ストックリストの設定
            </Typography>
          </Link>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          mb: 3,
          width: "100%",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* 💡 ストック専用サーチバーを追加 */}
        <StockSearchBar initialValue={q} />
      </Box>

      {/* 検索実行中のヒント表示 */}
      {q && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          「{q}」の条件に一致する記事を表示中
        </Typography>
      )}
      <Stack>
        {listDetail.stock_items.map((item) => (
          // Repositoryで整形した articles オブジェクトをそのまま渡す
          <ArticleCard key={item.id} article={item.articles} />
        ))}
      </Stack>
      {listDetail.pagination && listDetail.pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6, mb: 4 }}>
          <Pagination
            count={listDetail.pagination.totalPages}
            page={page}
            variant="outlined"
            shape="rounded"
            renderItem={(item) => {
              if (item.disabled) {
                return <PaginationItem {...item} />;
              }
              return (
                <Link
                  // 💡 現在のパスを維持したまま、searchパラメータだけをマージする
                  from={
                    username
                      ? "/$username/stocks/$listId"
                      : listId
                        ? "/stocks/$listId"
                        : "/stocks"
                  }
                  search={(prev: any) => ({ ...prev, page: item.page })}
                  style={{ textDecoration: "none" }}
                >
                  <PaginationItem {...item} />
                </Link>
              );
            }}
          />
        </Box>
      )}
    </Box>
  );
};
