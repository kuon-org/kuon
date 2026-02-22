import { Box, Divider, Typography, Stack, CircularProgress } from "@mui/material";
import { CommentCard } from "./CommentCard";
import { useComments } from "../../../hooks/useComments";
import { CommentEditor } from "./CommentEditor";

interface CommentProps {
    articleId: string;
}

export const Comment = ({ articleId }: CommentProps) => {
    const { comments, isLoading, isError } = useComments(articleId);
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (isError) {
        return <Typography color="error">コメントの読み込みに失敗しました。</Typography>;
    }

    return (
        <Box
            id={`${articleId}-comment`}
            sx={{
                display: "flex",
                flexDirection: "column",
                px: { xs: 2, md: 6 }, // レスポンシブ対応
                py: 4,
                borderRadius: 2,
                boxShadow: 1,
                gap: 2,
            }}
        >
            <Typography variant="h6">コメント ({comments.length})</Typography>
            <Divider />

            <Stack spacing={1} sx={{ mt: 2 }}>
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <CommentCard key={comment.id} comment={comment} />
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        この記事にコメントはありません。
                    </Typography>
                )}
            </Stack>
            <CommentEditor articleId={articleId} />
        </Box>
    );
};