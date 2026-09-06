import { Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { userRoute } from "../../routes";
import { Link } from "@tanstack/react-router";
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton";
import { useFollowersQuery, useUserQuery } from "../../hooks/users";

export const Follower = () => {
  const { username } = userRoute.useParams();
  const userQuery = useUserQuery(username);
  const followerQuery = useFollowersQuery(userQuery.data?.id);
  return (
    <Paper
      elevation={2}
      sx={{
        mt: 4,
        width: { xs: "100%", sm: "60vw" },
        display: "flex",
        mx: "auto",
        flexDirection: "column",
      }}
    >
      <Typography sx={{ mt: 2, ml: 2 }}>
        <Link
          to={userRoute.to}
          params={{
            username: username ?? "",
          }}
        >
          {username}
        </Link>
        のフォロワー
      </Typography>
      {followerQuery.isLoading ? (
        <LoadingSkelton />
      ) : (
        <UserList users={followerQuery.data ?? []}></UserList>
      )}
    </Paper>
  );
};
