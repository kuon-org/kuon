import { Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { userRoute } from "../../router";
import { Link } from "@tanstack/react-router";
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton";
import { useUserQuery } from "../../hooks/useUsers";


export const Following = () => {
    const { username } = userRoute.useParams();
    const { following, following_isLoading } = useUserQuery(username);
    return (
        <Paper
            elevation={2}
            sx={{ mt: 4, width: "60vw", display: "flex", mx: "auto", flexDirection: "column" }}
        >

            <Typography sx={{ mt: 2, ml: 2 }}>
                <Link to={userRoute.to} params={{
                    username: username ?? "",
                }} >{username}</Link>がフォローしているユーザ
            </Typography>
            {following_isLoading ? (
                <LoadingSkelton />
            ) : (

                <UserList users={following} ></UserList>
            )}
        </Paper>

    )

}