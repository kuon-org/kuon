import { Button } from "@mui/material";
import { useFollowUser, useUserFollowingStateQuery } from "../../hooks/users";
import { useAuthUserQuery } from "../../hooks/auth";
import { useCallback } from "react";
import { useNotify } from "../../hooks/useNotify";
import { useTranslation } from "react-i18next";

export const FollowButton = ({
  followeeId,
  username: _username,
}: {
  followeeId: string;
  username: string;
}) => {
  const authUserQuery = useAuthUserQuery();
  const isFollowingQuery = useUserFollowingStateQuery(
    followeeId,
    !!authUserQuery.data,
  );
  const follow = useFollowUser(authUserQuery.data?.id);
  const { error } = useNotify();
  const { t } = useTranslation("common");
  const isAuth = !!authUserQuery.data;

  const handleClick = useCallback(() => {
    if (!isAuth) return error(t("errors.loginRequired"));
    follow.mutate(followeeId);
  }, [isAuth, error, follow, followeeId, t]);

  if (isFollowingQuery.isError) error(t("errors.server"));
  if (isFollowingQuery.isLoading) return <>{t("loading")}</>;

  return (
    <Button
      variant={isFollowingQuery.data?.isFollow ? "outlined" : "contained"}
      size="small"
      disabled={isFollowingQuery.isLoading || follow.isPending}
      onClick={handleClick}
      sx={{
        minWidth: "90px",
        textTransform: "none",
      }}
    >
      {isFollowingQuery.data?.isFollow
        ? t("follow.following")
        : t("follow.follow")}
    </Button>
  );
};
