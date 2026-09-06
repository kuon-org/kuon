import { Box, Typography } from "@mui/material";
import { useAuthUserQuery } from "../../hooks/auth";
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
  const authUserQuery = useAuthUserQuery();
  const authUser = authUserQuery.data;
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
          const showFollowButton = authUser && authUser.id !== user.id;

          return (
            <UserCard
              key={user.id}
              image_src={user.avatar_url ?? ""}
              username={user.username}
              display_name={user.display_name}
              bio={user.bio ?? ""}
            >
              {showFollowButton && (
                <FollowButton followeeId={user.id} username={user.username} />
              )}
            </UserCard>
          );
        })
      ) : (
        <Box mx="auto">
          <Typography variant="caption">いいねした人はいません</Typography>
        </Box>
      )}
    </Box>
  );
};
