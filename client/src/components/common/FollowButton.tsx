import { Button } from "@mui/material";
import { useUserQuery } from "../../hooks/useUsers";
import { useAuthUserQuery } from "../../hooks/auth";
import { useCallback } from "react";
import { useNotify } from "../../hooks/useNotify";
import { useTranslation } from "react-i18next";

export const FollowButton = ({
  followeeId,
  username,
}: {
  followeeId: string;
  username: string;
}) => {
  const { isFollowing, isFollowingError, isFollowingLoading, follow } =
    useUserQuery(username);
  const authUserQuery = useAuthUserQuery();
  const { error } = useNotify();
  const { t } = useTranslation("common");
  const isAuth = !!authUserQuery.data;

  const handleClick = useCallback(() => {
    if (!isAuth) return error(t("errors.loginRequired"));
    follow(followeeId);
  }, [isAuth, error, follow, followeeId, t]);

  if (isFollowingError) error(t("errors.server"));
  if (isFollowingLoading) return <>{t("loading")}</>;

  return (
    <Button
      variant={isFollowing?.isFollow ? "outlined" : "contained"}
      size="small"
      disabled={isFollowingLoading}
      onClick={handleClick}
      sx={{
        minWidth: "90px",
        textTransform: "none",
      }}
    >
      {isFollowing?.isFollow ? t("follow.following") : t("follow.follow")}
    </Button>
  );
};
