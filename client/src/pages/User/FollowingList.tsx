import { Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { userRoute } from "../../router";
import { useUserQuery } from "../../hooks/useUsers";

export const FollowingList = () => {
    const { username } = userRoute.useParams();
    const { following, following_count, } = useUserQuery(username);
    return (
        <Paper sx={{ width:  { xs: "100%", sm: "600px" }, minHeight: "300px", p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                フォローしているユーザー
            </Typography>

            {following_count === 0 ? (
                <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 2, color: "text.secondary", textAlign: "center" }}
                >
                    フォローしているユーザーはいません
                </Typography>
            ) : (
                <UserList users={following} />
            )}
        </Paper>
    )
};