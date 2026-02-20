import { Box, Button, Typography } from "@mui/material";
import { useAuthQuery } from "../../hooks/useAuth";
import { useUserQuery } from "../../hooks/useUsers";
import { UserCard } from "../common/UserCard";
import { FollowButton } from "../common/FollowButton";

interface User {
    id: string;
    username: string;
    display_name: string;
    bio?: string;
    avatar_url?: string;
}

interface UserListProps {
    users: User[];
}

export const UserList = ({ users }: UserListProps) => {
    const { user: authUser } = useAuthQuery(); // ← ログイン状態を取得
    return (
        <Box
            sx={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
                gap: 2,
                p: 2,
            }}
        >
            {users.length !== 0 ? (

                users.map((user) => {
                    // 自分自身のカードにはフォローボタンを表示しない
                    const showFollowButton = authUser && authUser.id !== user.id;

                    return (
                        <UserCard
                            key={user.id}
                            image_src={user.avatar_url ?? ""}
                            username={user.username}
                            display_name={user.display_name}
                            bio={user.bio ?? ""}
                        >
                            {/* 👇 ログイン時のみフォローボタンを表示 */}
                            {showFollowButton && <FollowButton followeeId={user.id} username={user.username} />}
                        </UserCard>
                    );
                })

            ) : (
                <Box mx="auto">
                    <Typography variant="caption" >いいねした人はいません</Typography>
                </Box>
            )}

        </Box>
    );
};


