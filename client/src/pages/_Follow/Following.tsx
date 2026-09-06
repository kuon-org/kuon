import { Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { userRoute } from "../../routes";
import { Link } from "@tanstack/react-router";
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton";
import { useFollowingQuery, useUserQuery } from "../../hooks/users";

export const Following = () => {
  const { username } = userRoute.useParams();
  const userQuery = useUserQuery(username);
  const followingQuery = useFollowingQuery(userQuery.data?.id);
  return (
    <Paper
      elevation={2}
      sx={{
        mt: 4,
        width: "60vw",
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
        がフォローしているユーザ
      </Typography>
      {followingQuery.isLoading ? (
        <LoadingSkelton />
      ) : (
        <UserList users={followingQuery.data ?? []}></UserList>
      )}
    </Paper>
  );
};
