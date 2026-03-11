import { Button } from "@mui/material";
import { useUserQuery } from "../../hooks/useUsers";
import { useAuthQuery } from "../../hooks/useAuth";
import { useCallback } from "react";
import { useNotify } from "../../hooks/useNotify";

// シンプルなフォローボタン例
export const FollowButton = ({
  followeeId,
  username,
}: {
  followeeId: string;
  username: string;
}) => {
  const { isFollowing, isFollowingError, isFollowingLoading, follow } =
    useUserQuery(username);
  const { user } = useAuthQuery();
  const { error } = useNotify();
  const isAuth = !!user;
  const handleClick = useCallback(() => {
    if (!isAuth) return error("ログインしてください。");
    follow(followeeId);
  }, [isAuth, error]);
  if (isFollowingError) error("サーバエラー");
  if (isFollowingLoading) return <>読み込み中</>;
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
      {isFollowing?.isFollow ? "フォロー中" : "フォロー"}
    </Button>
  );
};
