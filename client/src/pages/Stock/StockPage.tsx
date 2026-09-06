import { Box, Container, Typography, Paper, Avatar, Stack, Divider, CircularProgress, Button } from "@mui/material";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import ArticleIcon from "@mui/icons-material/Article";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslation } from "react-i18next";
import { useLikeStockList, useStockListDetail, useStockListLike } from "../../hooks/stocks";
import { useAuthUserQuery } from "../../hooks/auth";
import { useUserQuery } from "../../hooks/useUsers";
import { TagChip } from "../../components/common/TagChip";
import { LikeButton } from "../../components/Like/LikeButton";

export const StockPage = () => {
  const { t, i18n } = useTranslation("articles");
  const { listId } = useParams({ strict: false });
  const listDetail = useStockListDetail(listId);
  const stockLike = useStockListLike(listId);
  const likeStock = useLikeStockList(listId);
  const detail = listDetail.data;
  const { isFollowing, follow } = useUserQuery(detail?.users.username || "");
  const authUserQuery = useAuthUserQuery();
  const authUser = authUserQuery.data;
  const isAuth = !!authUser;
  if (listDetail.isLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  if (!detail) return <Typography sx={{ p: 4 }}>{t("stock.notFound")}</Typography>;
  const isMe = authUser?.id === detail.users.id;
  const formattedDate = new Date(detail.created_at).toLocaleString(i18n.language);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
        <Box sx={{ width: { xs: "100%", md: "300px" }, flexShrink: 0 }}>
          <Paper variant="outlined" sx={{ p: 3, position: { md: "sticky" }, top: 96 }}>
            <Stack spacing={2.5}>
              <Typography variant="h5" sx={{ fontWeight: "bold", wordBreak: "break-word" }}>{detail.name}</Typography>
              <Divider />
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{detail.description || t("stock.noDescription")}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>{detail.stock_list_tags?.map((item: any) => <TagChip key={item.tags.id} tag={item.tags} />)}</Box>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><ArticleIcon fontSize="small" color="action" /><Typography variant="caption" fontWeight="bold">{t("stock.articleCount", { count: detail.totalCount || 0 })}</Typography></Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><AccessTimeIcon fontSize="small" color="action" /><Typography variant="caption">{t("stock.createdAt", { date: formattedDate })}</Typography></Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><LikeButton isLiked={stockLike.data ?? false} isLikePending={likeStock.isPending} mutateLike={() => likeStock.mutate()} /><Typography variant="caption">{detail._count?.stock_list_likes || 0}</Typography></Box>
              </Stack>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ display: "flex", justifyContent: "flex-start", flexDirection: "column", mt: 3, p: 3, position: { md: "sticky" }, top: 432 }}>
            <Typography variant="caption" sx={{ mb: 1 }}>{t("stock.author")}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Link to="/$username" params={{ username: detail.users.username }}><Avatar src={detail.users?.avatar_url} sx={{ width: 32, height: 32, bgcolor: "grey.200" }} /></Link>
              <Box sx={{ flex: 1, minWidth: 0 }}><Link to="/$username" params={{ username: detail.users.username }} style={{ textDecoration: "none", color: "inherit" }}><Box sx={{ display: "flex", gap: 0.5, "&:hover *": { textDecoration: "underline" }, "&:focus *": { textDecoration: "underline" } }}><Typography variant="subtitle2" sx={{ fontWeight: "bold", display: "inline-block" }}>@{detail.users.username}</Typography><Typography variant="subtitle2" sx={{ fontWeight: "bold", display: "block" }}>({detail.users.display_name})</Typography></Box></Link></Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{detail.users.bio || t("stock.noBio")}</Typography>
            {!isMe && isAuth && <Button variant={isFollowing?.isFollow ? "outlined" : "contained"} sx={{ mt: 2, width: "fit-content" }} onClick={() => { if (detail.users?.id) follow(detail.users.id); }}>{isFollowing?.isFollow ? t("stock.following") : t("stock.follow")}</Button>}
          </Paper>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><Outlet /></Box>
      </Box>
    </Container>
  );
};
