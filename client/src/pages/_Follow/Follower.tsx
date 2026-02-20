import { Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { userRoute } from "../../router";
import { Link } from "@tanstack/react-router";
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton";
import { useUserQuery } from "../../hooks/useUsers";


export const Follower = () => {
    const { username } = userRoute.useParams();
    const { follower, follower_isLoading } = useUserQuery(username);
    return (
        <Paper
            elevation={2}
            sx={{ mt: 4, width:  { xs: "100%", sm: "60vw" }, display: "flex", mx: "auto", flexDirection: "column" }}
        >

            <Typography sx={{ mt: 2, ml: 2 }}>
                <Link to={userRoute.to} params={{
                    username: username ?? "",
                }} >{username}</Link>のフォロワー
            </Typography>
            {follower_isLoading ? (
                <LoadingSkelton />
            ) : (

                <UserList users={follower} ></UserList>
            )}
        </Paper>

    )

}