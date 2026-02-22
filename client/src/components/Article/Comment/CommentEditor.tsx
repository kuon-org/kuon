import { useState, useRef } from 'react';
import { Box, Button, Stack, Paper, Typography } from '@mui/material';
import FastEditor, { type FastEditorRef } from '../../Editor/FastEditor'; // 先ほどのファイルをインポート
import { useComments } from '../../../hooks/useComments';
import { useAuthQuery } from '../../../hooks/useAuth';
import { NavButton } from '../../common/NavButton';

interface CommentEditorProps {
    articleId: string;
    parentCommentId?: string | null;
    onSuccess?: () => void; // 投稿成功時のコールバック（返信欄を閉じる等）
    placeholder?: string;
}

export const CommentEditor = ({
    articleId,
    parentCommentId = null,
    onSuccess,
    placeholder = "コメントを入力...",
}: CommentEditorProps) => {
    const [content, setContent] = useState('');
    const editorRef = useRef<FastEditorRef>(null);
    const { postComment, isPosting } = useComments(articleId);
    const { user } = useAuthQuery();
    if (!user) return (
        <Paper sx={{ bgcolor:"background.default", mx: "auto", py: 2, width: "70%", gap: 2, display: 'flex', flexDirection: "column", textAlign: "center" }}>
            <Typography variant='body1'>ログインしてコメントを残しましょう</Typography>
            <Box sx={{ display: 'flex', mx: "auto" }}>
                <NavButton
                    path="/login"
                    message="ログイン"
                    variant="outlined"
                />
                <NavButton
                    path="/register"
                    message="アカウント登録"
                    variant="contained"
                />
            </Box>
        </Paper>

    )
    const handlePost = () => {
        if (!content.trim()) return;

        postComment(
            {
                body: content,
                parent_comment_id: parentCommentId
            },
            {
                onSuccess: () => {
                    // エディタを空にする
                    setContent('');
                    editorRef.current?.setValue('');
                    if (onSuccess) onSuccess();
                },
            }
        );
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                '&:focus-within': {
                    borderColor: 'primary.main',
                },
            }}
        >
            <Stack spacing={2}>
                <Box
                    sx={{
                        minHeight: '80px',
                        maxHeight: '300px',
                        overflow: 'hidden',
                        position: 'relative',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        mb: 1,
                        // プレースホルダーの擬似要素設定
                        '& [data-placeholder]:empty:before': {
                            content: 'attr(data-placeholder)',
                            color: 'text.disabled',
                            cursor: 'text',
                        },
                    }}
                >
                    <FastEditor
                        ref={editorRef}
                        value={content}
                        onChange={setContent}
                        placeholder={placeholder}
                    />
                </Box>

                <Stack direction="row" justifyContent="flex-end" alignItems="center">
                    <Button
                        variant="contained"
                        disabled={!content.trim() || isPosting}
                        onClick={handlePost}
                        sx={{
                            borderRadius: '20px',
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 'bold',
                        }}
                    >
                        {isPosting ? '送信中...' : parentCommentId ? '返信する' : 'コメントする'}
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
};