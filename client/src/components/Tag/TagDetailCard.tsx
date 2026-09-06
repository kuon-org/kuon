import {
  Avatar,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { type Tag, useTagFollowStateQuery, useToggleTagFollow } from "../../hooks/tags";
import { useAuthUserQuery } from "../../hooks/auth";
import { useMyPermissionsQuery } from "../../hooks/roles";
import { MoreHButton } from "../common/MoreHbutton";
import Loading from "../common/Loading/Loading";
import { useNavigate } from "@tanstack/react-router";
import { tagEditRoute } from "../../routes";
import { useTranslation } from "react-i18next";

interface TagDetailCardProps {
  tag: Tag;
  slug: string;
}

export const TagDetailCard = ({ tag, slug }: TagDetailCardProps) => {
  const { t } = useTranslation("tags");
  const navigate = useNavigate();
  const authUserQuery = useAuthUserQuery();
  const user = authUserQuery.data;
  const permissionsQuery = useMyPermissionsQuery(!!user);
  const permissions = permissionsQuery.data?.permissions ?? [];
  const followState = useTagFollowStateQuery(slug, !!user);
  const toggleFollow = useToggleTagFollow(slug);
  const canManageTag = permissions.includes("tag.manage");

  if (followState.isLoading) return <Loading />;
  if (followState.isError) return <>{t("detail.loadError")}</>;
  if (!tag) return <>{t("detail.notFound", { slug })}</>;

  const handleEdit = () => {
    navigate({ to: tagEditRoute.to, params: { slug } });
  };

  return (
    <Paper sx={{ width: { xs: "100%", sm: "360px" }, maxWidth: { xs: "100%", sm: "360px" }, minHeight: "400px", display: "flex", flexDirection: "column" }}>
      {canManageTag && (
        <Box sx={{ display: "flex", justifyContent: "end" }}>
          <MoreHButton anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
            <MenuItem onClick={handleEdit}>{t("detail.edit")}</MenuItem>
          </MoreHButton>
        </Box>
      )}
      <Box sx={{ mx: "auto", mt: 6, display: "flex", flexDirection: "column", textAlign: "center" }}>
        <Avatar src={tag.avatar_url} sx={{ mx: "auto", width: "56px", height: "56px", bgcolor: "grey.200" }} />
        <Box sx={{ mt: 2 }}><Typography variant="h5">{tag.name}</Typography></Box>
      </Box>
      <Box sx={{ mt: 3, mx: "auto", display: "flex", flexDirection: "row", gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
          <Typography variant="caption">{tag.articleCount}</Typography>
          <Typography variant="caption">{t("detail.articles")}</Typography>
        </Box>
        <Divider orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
          <Typography variant="caption">{tag.followCount}</Typography>
          <Typography variant="caption">{t("detail.followers")}</Typography>
        </Box>
      </Box>
      {user && (
        <Box sx={{ display: "flex", mt: 4, mx: "auto" }}>
          <Button variant={followState.data?.isFollow ? "outlined" : "contained"} onClick={() => toggleFollow.mutate(slug)}>
            {followState.data?.isFollow ? t("detail.following") : t("detail.follow")}
          </Button>
        </Box>
      )}
    </Paper>
  );
};
