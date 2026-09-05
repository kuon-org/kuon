import React, { useState } from "react";
import { Box, Typography, Pagination, Stack, CircularProgress, Divider, Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";
import { ArticleCard } from "../../components/Article/ArticleCard";
import { useTranslation } from "react-i18next";

interface UserArticlesProps { userId: string; }

export const UserArticles = ({ userId }: UserArticlesProps) => {
  const { t } = useTranslation("users");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", "user", userId, { page, limit }],
    queryFn: async () => { const res = await apiClient.get(`/articles/user/${userId}`, { params: { page, limit } }); return res.data; },
    enabled: !!userId,
  });

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => { setPage(value); window.scrollTo({ top: 0, behavior: "smooth" }); };
  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (isError) return <Typography color="error" sx={{ py: 4 }}>{t("articles.loadError")}</Typography>;

  const articles = data?.articles ?? [];
  const totalPages = data?.totalPages ?? 0;
  return (
    <Paper sx={{ mx: "auto", width: { xs: "100%", sm: "600px" }, p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ px: 1 }}>{t("articles.title")}</Typography>
      <Divider sx={{ mb: 3 }} />
      {articles.length > 0 ? (
        <Stack>
          <Box sx={{ display: "flex", flexDirection: "column" }}>{articles.map((article: any) => <ArticleCard key={article.id} article={article} />)}</Box>
          {totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}><Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" /></Box>}
        </Stack>
      ) : <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", py: 8 }}>{t("articles.empty")}</Typography>}
    </Paper>
  );
};
