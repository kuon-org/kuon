import { Paper, Avatar, Box, Typography, Divider, Button } from "@mui/material";
import { useUserQuery } from "../../hooks/useUsers";
import { useAuthQuery } from "../../hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import { publicProfileRoute, userFollowerRoute, userFollowingRoute, userProfileIndexRoute } from "../../routes";
import { useTranslation } from "react-i18next";

interface UserDetailCardProps { username: string; }

export const UserDetailCard = ({ username }: UserDetailCardProps) => {
  const { t } = useTranslation("users");
  const { user: data } = useAuthQuery();
  const { user, isFollowing, follow, follower_count, following_count, commentCount, commentCountIsLoading, articleCount, articleCountIsLoading } = useUserQuery(username);
  const navigate = useNavigate();
  if (commentCountIsLoading || articleCountIsLoading) return <></>;
  const contribution = commentCount + articleCount;
  const isMe = user?.id === data?.id;
  if (!user) return <>{t("profile.notFound")}</>;
  return (
    <Paper sx={{ width: "100%", minWidth: "430px", maxWidth: "100%", minHeight: "430px", display: "flex", flexDirection: "column" }}>
      <Box sx={{ mx: "auto", mt: 6, display: "flex", flexDirection: "column", textAlign: "center" }}>
        <Avatar src={user.avatar_url} sx={{ mx: "auto", width: "56px", height: "56px", bgcolor: "grey.200" }} />
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">{user.display_name}</Typography>
          <Typography variant="subtitle2">@{user.username}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", mt: 2, mx: "auto", alignItems: "center", gap: 1 }}>
        <Typography variant="body1">{contribution}</Typography>
        <Typography variant="caption">{t("profile.contribution")}</Typography>
      </Box>
      <Divider sx={{ mt: 1, mx: "auto", width: "50%" }} />
      <Box sx={{ mx: "auto", display: "flex", flexDirection: "row", gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center", color: "inherit", "&:hover": { textDecoration: "underline" }, "&:focus": { textDecoration: "underline" } }}>
          <Link to={userProfileIndexRoute.to} params={{ username }} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
            <Typography variant="caption">{articleCount}</Typography>
            <Typography variant="caption">{t("profile.posts")}</Typography>
          </Link>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center", color: "inherit", "&:hover": { textDecoration: "underline" }, "&:focus": { textDecoration: "underline" } }}>
          <Link to={userFollowingRoute.to} params={{ username }} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
            <Typography variant="caption">{following_count}</Typography>
            <Typography variant="caption">{t("profile.following")}</Typography>
          </Link>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center", color: "inherit", "&:hover": { textDecoration: "underline" }, "&:focus": { textDecoration: "underline" } }}>
          <Link to={userFollowerRoute.to} params={{ username }} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
            <Typography variant="caption">{follower_count}</Typography>
            <Typography variant="caption">{t("profile.followers")}</Typography>
          </Link>
        </Box>
      </Box>
      {user.bio && <Box sx={{ mt: 2, px: 2, textAlign: "start", fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.66, letterSpacing: "0.03333em" }}>{user.bio}</Box>}
      {isMe ? (
        <Button variant="contained" sx={{ mt: 2, mx: "auto", width: "80%" }} onClick={() => navigate({ to: publicProfileRoute.to })}>
          {t("profile.edit")}
        </Button>
      ) : (
        data && (
          <Button variant={isFollowing?.isFollow ? "outlined" : "contained"} sx={{ mt: 2, mx: "auto", width: "80%" }} onClick={() => { if (user?.id) follow(user.id); }}>
            {isFollowing?.isFollow ? t("profile.followingButton") : t("profile.follow")}
          </Button>
        )
      )}
    </Paper>
  );
};
