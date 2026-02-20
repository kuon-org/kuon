// import { Paper, Avatar, Box, Typography, Divider, Button } from "@mui/material";
// import { useUserQuery } from "../../hooks/useUsers";
// import { useAuthQuery } from "../../hooks/useAuth";
// import { Link } from "@tanstack/react-router";
// import { userFollowerRoute, userFollowingRoute } from "../../router";

// interface UserDetailCardProps {
//     username: string;
// }

// const mockdata = {
//     article_count: 0,
//     follow_count: 0,
//     follower_count: 0,
//     contribution: 0,

// }

// export const UserDetailCard = ({ username }: UserDetailCardProps) => {
//     const { data } = useAuthQuery();
//     const { user, isFollowing, follow, follower_count, following_count } = useUserQuery(username);

//     const isMe = user.id === data.id;
//     return (
//         <Paper sx={{ width: "360px", maxWidth: "360px", minHeight: "380px", display: "flex", flexDirection: "column" }}>
//             <Box sx={{ mx: "auto", mt: 6, display: "flex", flexDirection: "column", textAlign: "center" }}>
//                 <Avatar
//                     src={user.avatar_url}
//                     sx={{ mx: "auto", width: "56px", height: "56px" }}
//                 />
//                 <Box sx={{ mt: 2 }}>
//                     <Typography variant="subtitle1">@{user.username}</Typography>
//                 </Box>
//             </Box>
//             <Box sx={{ display: "flex", mt: 2, mx: "auto", alignItems: "center", gap: 1 }}>
//                 <Typography variant="body1">{mockdata.contribution}</Typography><Typography variant="caption"> Contribution</Typography>
//             </Box>

//             <Divider sx={{ mt: 1, mx: "auto", width: "50%" }} />
//             <Box sx={{ mx: "auto", display: "flex", flexDirection: "row", gap: 2 }}>
//                 <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
//                     <Typography variant="caption">{mockdata.article_count}</Typography>
//                     <Typography variant="caption">投稿</Typography>
//                 </Box>
//                 <Link to={userFollowingRoute.to} params={{
//                     username: username ?? "",
//                 }}
//                     style={{ textDecoration: "none", color: "inherit" }}
//                 >
//                     <Box sx={{
//                         display: "flex", flexDirection: "column", textAlign: "center",
//                         color: "inherit",
//                         "&:hover": { textDecoration: "underline" },
//                         "&:focus": { textDecoration: "underline" },
//                     }}>

//                         <Typography variant="caption">{following_count}</Typography>
//                         <Typography variant="caption">フォロー</Typography>

//                     </Box>
//                 </Link>
//                 <Link to={userFollowerRoute.to} params={{
//                     username: username ?? "",
//                 }}
//                     style={{ textDecoration: "none", color: "inherit" }}
//                 >
//                     <Box sx={{
//                         display: "flex", flexDirection: "column", textAlign: "center",
//                         color: "inherit",
//                         "&:hover": { textDecoration: "underline" },
//                         "&:focus": { textDecoration: "underline" },
//                     }}>
//                         <Typography variant="caption">{follower_count}</Typography>
//                         <Typography variant="caption">フォロワー</Typography>
//                     </Box>
//                 </Link>
//             </Box>
//             {
//                 user.bio && (
//                     <Box sx={{ mt: 2, px: 2, textAlign: "start", fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.66, letterSpacing: "0.03333em" }}>
//                         {user.bio}
//                     </Box>
//                 )
//             }
//             {
//                 isMe ? (
//                     <Button
//                         variant="contained"
//                         sx={{ mt: 2, mx: "auto", width: "80%" }}
//                     >
//                         プロフィールを編集する
//                     </Button>
//                 ) : (
//                     <Button
//                         variant="contained"
//                         sx={{ mt: 2, mx: "auto", width: "80%" }}
//                         onClick={() => {
//                             if (user?.id) follow(user.id); // userIdを渡してフォロー
//                         }}
//                     >
//                         {isFollowing?.isFollow ? "フォロー中" : "フォローする"}
//                     </Button>
//                 )
//             }


//         </Paper >
//     )
// }

import { Paper, Avatar, Box, Typography, Divider, Button } from "@mui/material";
import { useUserQuery } from "../../hooks/useUsers";
import { useAuthQuery } from "../../hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import { publicProfileRoute, userFollowerRoute, userFollowingRoute, userProfileIndexRoute } from '../../router'

interface UserDetailCardProps {
    username: string;
}

const mockdata = {
    article_count: 0,
    follow_count: 0,
    follower_count: 0,
    contribution: 0,

}

export const UserDetailCard = ({ username, }: UserDetailCardProps) => {
    const { user: data } = useAuthQuery();
    const { user, isFollowing, follow, follower_count, following_count } = useUserQuery(username);
    const navigate = useNavigate();
    const isMe = user?.id === data?.id;
    return (
        <Paper
            sx={{
                width: { xs: "100%", sm: "360px" },   // 👈 スマホでは横いっぱい、PCでは固定幅
                maxWidth: { xs: "100%", sm: "360px" }, // 👈 同じくmaxWidthも調整
                minHeight: "400px",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box sx={{ mx: "auto", mt: 6, display: "flex", flexDirection: "column", textAlign: "center" }}>
                <Avatar
                    src={user.avatar_url}
                    sx={{ mx: "auto", width: "56px", height: "56px", bgcolor: "grey.200" }}
                />
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">{user.display_name}</Typography>
                    <Typography variant="subtitle2">@{user.username}</Typography>
                </Box>
            </Box>
            <Box sx={{ display: "flex", mt: 2, mx: "auto", alignItems: "center", gap: 1 }}>
                <Typography variant="body1">{mockdata.contribution}</Typography><Typography variant="caption"> Contribution</Typography>
            </Box>

            <Divider sx={{ mt: 1, mx: "auto", width: "50%" }} />
            <Box sx={{ mx: "auto", display: "flex", flexDirection: "row", gap: 2 }}>
                <Box
                    sx={{
                        display: "flex", flexDirection: "column", textAlign: "center",
                        color: "inherit",
                        "&:hover": { textDecoration: "underline" },
                        "&:focus": { textDecoration: "underline" },
                    }} >
                    <Link
                        to={userProfileIndexRoute.to}
                        params={{ username }}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                    >
                        <Typography variant="caption">{mockdata.article_count}</Typography>
                        <Typography variant="caption">投稿</Typography>
                    </Link>
                </Box>

                <Box sx={{
                    display: "flex", flexDirection: "column", textAlign: "center",
                    color: "inherit",
                    "&:hover": { textDecoration: "underline" },
                    "&:focus": { textDecoration: "underline" },
                }}
                >
                    <Link
                        to={userFollowingRoute.to}
                        params={{ username }}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                    >

                        <Typography variant="caption">{following_count}</Typography>
                        <Typography variant="caption">フォロー</Typography>
                    </Link>

                </Box>
                <Box sx={{
                    display: "flex", flexDirection: "column", textAlign: "center",
                    color: "inherit",
                    "&:hover": { textDecoration: "underline" },
                    "&:focus": { textDecoration: "underline" },

                }}
                >
                    <Link
                        to={userFollowerRoute.to}
                        params={{ username }}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                    >

                        <Typography variant="caption">{follower_count}</Typography>
                        <Typography variant="caption">フォロワー</Typography>
                    </Link>
                </Box>
            </Box>
            {
                user.bio && (
                    <Box sx={{ mt: 2, px: 2, textAlign: "start", fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.66, letterSpacing: "0.03333em" }}>
                        {user.bio}
                    </Box>
                )
            }
            {
                isMe ? (
                    <Button
                        variant="contained"
                        sx={{ mt: 2, mx: "auto", width: "80%" }}
                        onClick={() => navigate({ to: publicProfileRoute.to })}
                    >
                        プロフィールを編集する
                    </Button>
                ) : data && (
                    <Button
                        variant={isFollowing?.isFollow ? "outlined" : "contained"}
                        sx={{ mt: 2, mx: "auto", width: "80%" }}
                        onClick={() => {
                            if (user?.id) follow(user?.id); // userIdを渡してフォロー
                        }}
                    >
                        {isFollowing?.isFollow ? "フォロー中" : "フォローする"}
                    </Button>
                )
            }


        </Paper >
    )
}