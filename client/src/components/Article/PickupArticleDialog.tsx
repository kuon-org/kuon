import {
  Dialog, DialogTitle, DialogContent, List, ListItem, ListItemButton,
  ListItemText, DialogActions, Button, Typography, Chip, Box,
  CircularProgress, Divider,
} from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/client";
import type { Article } from "../../hooks/articles";
import React from "react";

interface PickupArticleDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentPickups: Article[] | undefined;
  onToggle: (articleId: string, isPicked: boolean) => void;
  isSubmitting: boolean;
}

export const PickupArticleDialog = ({ open, onClose, userId, currentPickups, onToggle, isSubmitting }: PickupArticleDialogProps) => {
  const { t } = useTranslation("articles");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ["articles", "user", "infinite", userId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get(`/articles/user/${userId}`, { params: { page: pageParam, limit: 10 } });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    enabled: open && !!userId,
  });

  const pickedIds = new Set(currentPickups?.map((p) => p.id));
  const allArticles = data?.pages.flatMap((page) => page.articles) ?? [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("pickup.title")}</DialogTitle>
      <DialogContent dividers sx={{ p: 0, maxHeight: "400px" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
        ) : isError ? (
          <Typography p={2} color="error">{t("pickup.fetchFailed")}</Typography>
        ) : allArticles.length > 0 ? (
          <Box>
            <List sx={{ py: 0 }}>
              {allArticles.map((article, index) => {
                const isPicked = pickedIds.has(article.id);
                return (
                  <React.Fragment key={article.id}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => onToggle(article.id, isPicked)} disabled={isSubmitting}>
                        <ListItemText primary={article.title} secondary={new Date(article.created_at).toLocaleString()} />
                        <Box sx={{ ml: 2 }}>
                          <Chip label={t(isPicked ? "pickup.picked" : "pickup.notSet")} color={isPicked ? "primary" : "default"} size="small" variant={isPicked ? "filled" : "outlined"} />
                        </Box>
                      </ListItemButton>
                    </ListItem>
                    {index < allArticles.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
            <Box sx={{ p: 2, textAlign: "center" }}>
              {hasNextPage ? (
                <Button variant="outlined" size="small" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} fullWidth>
                  {isFetchingNextPage ? <CircularProgress size={20} /> : t("pickup.loadMore")}
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">{t("pickup.allLoaded")}</Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Typography p={2} textAlign="center" color="text.secondary">{t("pickup.noPublishedArticles")}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">{t("pickup.done")}</Button>
      </DialogActions>
    </Dialog>
  );
};
