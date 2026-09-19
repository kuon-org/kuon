import { Box, Typography } from "@mui/material";
import { useFollowingTagsQuery } from "../../hooks/tags";
import { TagChip } from "../../components/common/TagChip";
import Loading from "../../components/common/Loading/Loading";
import { Link } from "@tanstack/react-router";
import { userFollowingTagsRoute } from "../../routes";
import { useTranslation } from "react-i18next";

export const FollowingTags = ({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) => {
  const { t } = useTranslation("users");
  const followingTagsQuery = useFollowingTagsQuery(userId);
  const followingTags = followingTagsQuery.data;

  if (followingTagsQuery.isLoading) return <Loading />;
  if (followingTagsQuery.isError) return <>{t("followingTags.loadError")}</>;
  if (!followingTags || followingTags.tags.length === 0) {
    return (
      <Box>
        <Typography variant="h6">
          {t("followingTags.title", { count: 0 })}
        </Typography>
        <Typography variant="caption">{t("followingTags.empty")}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Typography>
          {t("followingTags.title", { count: followingTags.tags.length })}
        </Typography>
        <Link
          to={userFollowingTagsRoute.to}
          params={{ username }}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Typography
            variant="body2"
            sx={{ cursor: "pointer", color: "text.secondary" }}
          >
            {t("followingTags.viewAll")}
          </Typography>
        </Link>
      </Box>
      {followingTags.tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} />
      ))}
    </Box>
  );
};
