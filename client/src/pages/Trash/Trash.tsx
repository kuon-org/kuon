import { Container, Paper, Typography, List, ListItem, ListItemText, Box, Button } from "@mui/material";

import { useArticles } from "../../hooks/useArticles";

export const Trash = () => {
    const { trashArticles, trash_isLoading, restoreArticle, hardDeleteArticle } = useArticles();
    const articles = trashArticles ?? [];

    return (
        <Container sx={{ mt: 4 }} maxWidth="md">
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" mb={2}>ゴミ箱</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    ここにある記事は公開されません。復元するか、完全に削除してください。
                </Typography>
                <List>
                    {trash_isLoading ? (
                        <ListItem><ListItemText primary="読み込み中..." /></ListItem>
                    ) : (
                        articles.map(a => (
                            <ListItem key={a.id} divider>
                                <ListItemText 
                                    primary={a.title || "無題の記事"} 
                                    secondary={`削除日: ${new Date(a.updated_at).toLocaleString()}`} 
                                />
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button size="small" variant="contained" color="success" onClick={() => restoreArticle(a.id)}>
                                        復元
                                    </Button>
                                    <Button size="small" variant="outlined" color="error" onClick={() => {
                                        if(window.confirm("完全に削除しますか？")) hardDeleteArticle(a.id);
                                    }}>
                                        完全削除
                                    </Button>
                                </Box>
                            </ListItem>
                        ))
                    )}
                    {!trash_isLoading && articles.length === 0 && (
                        <Typography textAlign="center" py={4}>ゴミ箱は空です</Typography>
                    )}
                </List>
            </Paper>
        </Container>
    );
};