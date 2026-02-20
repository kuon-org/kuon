import { Button } from "@mui/material";
import { useUserQuery } from "../../hooks/useUsers";

// シンプルなフォローボタン例
export const FollowButton = ({ followeeId, username }: { followeeId: string; username: string }) => {
    const { isFollowing, isFollowingError, isFollowingLoading, follow } = useUserQuery(username);
    console.log(isFollowingError)
    if (isFollowingLoading) return <>読み込み中</>
    return (
        <Button
            variant={isFollowing?.isFollow ? "outlined" : "contained"}
            size="small"
            disabled={isFollowingLoading}
            onClick={() => follow(followeeId)}
            sx={{
                minWidth: "90px",
                textTransform: "none",
            }}
        >
            {isFollowing?.isFollow ? "フォロー中" : "フォロー"}
        </Button>
    );
};