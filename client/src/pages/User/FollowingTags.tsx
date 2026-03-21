import { Box, Typography } from "@mui/material";
import { useTagsQuery } from "../../hooks/useTags";
import { TagChip } from "../../components/common/TagChip";
import Loading from "../../components/common/Loading/Loading";
import { Link } from "@tanstack/react-router";
import { userFollowingTagsRoute } from "../../router";

export const FollowingTags = ({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) => {
  const { followingTags, followingTagsIsLoading, followingTagsIsError } =
    useTagsQuery(undefined, userId);
  if (followingTagsIsLoading) return <Loading />;
  if (followingTagsIsError) return <>タグの取得に失敗しました</>;
  if (!followingTags || followingTags.tags.length === 0)
    return (
      <Box>
        <Typography variant="h6">フォロー中のタグ(0)</Typography>
        <Typography variant="caption">フォロー中のタグはありません</Typography>
      </Box>
    );
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Typography>フォロー中のタグ({followingTags.tags?.length})</Typography>

        {/* 2つ目の子要素 */}
        <Link
          to={userFollowingTagsRoute.to}
          params={{ username: username }}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Typography
            variant="body2"
            sx={{ cursor: "pointer", color: "text.secondary" }}
          >
            すべて見る
          </Typography>
        </Link>
      </Box>
      {followingTags.tags.map((t) => {
        return <TagChip key={t.id} tag={t} />;
      })}
    </Box>
  );
};
