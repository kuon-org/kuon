import React, { useState } from "react";
import { Box, Typography, Pagination, Stack, CircularProgress, Divider, Paper, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";
import { userRoute, tagsRoute } from "../../routes";
import { useUserQuery } from "../../hooks/useUsers";
import { TagCard } from "../../components/Tag/TagCard";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const FollowingTagsPage = () => {
  const { t } = useTranslation("users");
  const navigate = useNavigate();
  const { username } = userRoute.useParams();
  const { user } = useUserQuery(username);
  const [page, setPage] = useState(1);
  const limit = 10;
  const userId = user?.id;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["followingTags", userId, page],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userId}/following_tags`, { params: { page, limit } });
      return res.data;
    },
    enabled: !!userId,
  });

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => { setPage(value); window.scrollTo({ top: 0, behavior: "smooth" }); };
  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (isError) return <Typography color="error" sx={{ py: 4 }}>{t("followingTags.loadError")}</Typography>;

  const totalPages = data?.totalPages ?? 0;
  const tags = data?.tags ?? [];
  return (
    <>
      <Paper sx={{ mx: "auto", width: { xs: "100%", sm: "600px" }, p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ px: 1 }}>{t("followingTags.pageTitle")}</Typography>
        <Divider sx={{ mb: 3 }} />
        {tags.length > 0 ? (
          <Stack>
            <Box sx={{ display: "flex", flexDirection: "column" }}>{tags.map((tag: any) => <TagCard key={tag.id} tag={tag} />)}</Box>
            {totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}><Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" /></Box>}
          </Stack>
        ) : <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", py: 8 }}>{t("followingTags.empty")}</Typography>}
      </Paper>
      <Paper sx={{ mx: "auto", mb: 2, width: { xs: "100%", sm: "600px" }, p: 2, textAlign: "center" }}>
        <SearchIcon />
        <Typography variant="h6" gutterBottom sx={{ px: 1 }}>{t("followingTags.discoverTitle")}</Typography>
        <Button variant="contained" onClick={() => navigate({ to: tagsRoute.to })}>{t("followingTags.discoverAction")}</Button>
      </Paper>
    </>
  );
};
