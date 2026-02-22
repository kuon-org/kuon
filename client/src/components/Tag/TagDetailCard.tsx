import { Avatar, Box, Button, Divider, MenuItem, Paper, Typography } from "@mui/material";
import { type Tag } from "../../hooks/useTags";
import { useAuthQuery } from "../../hooks/useAuth";
import { MoreHButton } from "../common/MoreHbutton";


interface TagDetailCardProps {
    tag: Tag;
    slug: string;
}
export const TagDetailCard = ({ tag, slug }: TagDetailCardProps) => {
    const { user } = useAuthQuery();
    const isEditor = user?.role === "admin" ? true : user?.role === "moderator" ? true : false;
    console.log(user)
    if (!tag) return <>{slug}タグは存在しません</>
    console.log(tag)
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
            {isEditor && (
                <Box sx={{ display: "flex", justifyContent: "end" }}>
                    <MoreHButton
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem>タグを編集する</MenuItem>
                    </MoreHButton>
                </Box>
            )}


            <Box sx={{ mx: "auto", mt: 6, display: "flex", flexDirection: "column", textAlign: "center" }}>
                <Avatar
                    src={tag.avatar_url}
                    sx={{ mx: "auto", width: "56px", height: "56px", bgcolor: "grey.200" }}
                />
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5">{tag.name}</Typography>
                </Box>
            </Box>
            <Box sx={{ mt: 3, mx: "auto", display: "flex", flexDirection: "row", gap: 2 }}>

                <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
                    <Typography variant="caption">{tag.articleCount}</Typography>
                    <Typography variant="caption">記事</Typography>
                </Box>
                <Divider orientation="vertical" />
                <Box sx={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
                    <Typography variant="caption">{tag.followCount}</Typography>
                    <Typography variant="caption">フォロワー</Typography>
                </Box>
            </Box>
            <Box sx={{ display: "flex", mt: 4, mx: "auto" }}>
                <Button variant="outlined">タグをフォローする</Button>
            </Box>
        </Paper>
    )
}