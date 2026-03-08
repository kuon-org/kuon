// src/pages/Stocks/StockPage.tsx
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { useStocks } from "../../hooks/useStocks";
import ArticleIcon from "@mui/icons-material/Article";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useAuthQuery } from "../../hooks/useAuth";
import { useUserQuery } from "../../hooks/useUsers";
import { TagChip } from "../../components/common/TagChip";
import { LikeButton } from "../../components/Like/LikeButton";

export const StockPage = () => {
  const { listId } = useParams({ strict: false });
  const { listDetail, isDetailLoading, isLiked, like, isLiking } = useStocks(
    undefined,
    listId,
  );
  const { isFollowing, follow } = useUserQuery(
    listDetail?.users.username || "",
  );
  const { user: authUser } = useAuthQuery();
  if (isDetailLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!listDetail) {
    return (
      <Typography sx={{ p: 4 }}>リストが見つかりませんでした。</Typography>
    );
  }

  const isMe = authUser?.id === listDetail.users.id;
  // 日付整形
  const formattedDate = new Date(listDetail.created_at).toLocaleDateString(
    "ja-JP",
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        {/* 左側：ストックリストの基本情報 (Sidebar風) */}
        <Box sx={{ width: { xs: "100%", md: "300px" }, flexShrink: 0 }}>
          <Paper
            variant="outlined"
            sx={{ p: 3, position: { md: "sticky" }, top: 96 }}
          >
            <Stack spacing={2.5}>
              {/* リスト名 */}
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", wordBreak: "break-word" }}
              >
                {listDetail.name}
              </Typography>

              <Divider />

              {/* 説明文 */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-wrap" }}
              >
                {listDetail.description || "説明はありません。"}
              </Typography>
              {/* タグ */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {listDetail.stock_list_tags?.map((t: any) => (
                  <TagChip key={t.tags.id} tag={t.tags} />
                ))}
              </Box>
              {/* メタ情報 */}
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ArticleIcon fontSize="small" color="action" />
                  <Typography variant="caption" fontWeight="bold">
                    {listDetail.totalCount || 0} 記事
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="caption">
                    作成日: {formattedDate}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LikeButton
                    isLiked={isLiked}
                    isLikePending={isLiking}
                    mutateLike={like}
                  />
                  <Typography variant="caption">
                    {listDetail._count?.stock_list_likes || 0}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
          {/* ユーザー情報 */}
          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              flexDirection: "column",
              mt: 3,
              p: 3,
              position: { md: "sticky" },
              top: 432,
            }}
          >
            <Typography variant="caption" sx={{ mb: 1 }}>
              作成者
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Link
                to="/$username"
                params={{ username: listDetail.users.username }}
              >
                <Avatar
                  src={listDetail.users?.avatar_url}
                  sx={{ width: 32, height: 32, bgcolor: "grey.200" }}
                />
              </Link>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Link
                  to="/$username"
                  params={{ username: listDetail.users.username }}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      "&:hover *": { textDecoration: "underline" },
                      "&:focus *": { textDecoration: "underline" },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", display: "inline-block" }}
                    >
                      @{listDetail.users.username}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", display: "block" }}
                    >
                      ({listDetail.users.display_name})
                    </Typography>
                  </Box>
                </Link>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {listDetail.users.bio || "自己紹介はありません。"}
            </Typography>
            {/* フォローボタンは自分のプロフィールでは表示しない */}
            {!isMe && (
              <Button
                variant={isFollowing?.isFollow ? "outlined" : "contained"}
                sx={{ mt: 2, width: "fit-content" }}
                onClick={() => {
                  if (listDetail.users?.id) follow(listDetail.users.id); // userIdを渡してフォロー
                }}
              >
                {isFollowing?.isFollow ? "フォロー中" : "フォロー"}
              </Button>
            )}
          </Paper>
        </Box>

        {/* 右側：記事一覧 (Outlet) */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Container>
  );
};
