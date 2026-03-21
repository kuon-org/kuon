import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";
import type { Article } from "../../hooks/useArticles";
import React from "react";

interface PickupArticleDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string; // userIdを受け取るように変更
  currentPickups: Article[] | undefined;
  onToggle: (articleId: string, isPicked: boolean) => void;
  isSubmitting: boolean;
}

export const PickupArticleDialog = ({
  open,
  onClose,
  userId,
  currentPickups,
  onToggle,
  isSubmitting,
}: PickupArticleDialogProps) => {
  // ダイアログ内で直接無限スクロールの取得を管理
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["articles", "user", "infinite", userId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get(`/articles/user/${userId}`, {
        params: { page: pageParam, limit: 10 },
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: open && !!userId, // ダイアログが開いている時のみ実行
  });

  // すでにピックアップされているIDのセットを作成
  const pickedIds = new Set(currentPickups?.map((p) => p.id));

  // 全ページの記事をフラットな配列に変換
  const allArticles = data?.pages.flatMap((page) => page.articles) ?? [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>ピックアップ記事の設定</DialogTitle>
      <DialogContent dividers sx={{ p: 0, maxHeight: "400px" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Typography p={2} color="error">
            記事の取得に失敗しました
          </Typography>
        ) : allArticles.length > 0 ? (
          <Box>
            <List sx={{ py: 0 }}>
              {allArticles.map((article, index) => {
                const isPicked = pickedIds.has(article.id);
                return (
                  <React.Fragment key={article.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => onToggle(article.id, isPicked)}
                        disabled={isSubmitting}
                      >
                        <ListItemText
                          primary={article.title}
                          secondary={new Date(
                            article.created_at,
                          ).toLocaleDateString()}
                        />
                        <Box sx={{ ml: 2 }}>
                          {isPicked ? (
                            <Chip
                              label="ピックアップ中"
                              color="primary"
                              size="small"
                              variant="filled"
                            />
                          ) : (
                            <Chip
                              label="未設定"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                    {index < allArticles.length - 1 && (
                      <Divider component="li" />
                    )}
                  </React.Fragment>
                );
              })}
            </List>

            {/* 追加読み込みエリア */}
            <Box sx={{ p: 2, textAlign: "center" }}>
              {hasNextPage ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  fullWidth
                >
                  {isFetchingNextPage ? (
                    <CircularProgress size={20} />
                  ) : (
                    "もっと読み込む"
                  )}
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  すべての記事を表示しました
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Typography p={2} textAlign="center" color="text.secondary">
            公開されている記事がありません
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          完了
        </Button>
      </DialogActions>
    </Dialog>
  );
};
