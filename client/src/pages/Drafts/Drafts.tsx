import { Container, Paper, Typography, FormControlLabel, List, ListItem, ListItemText, ListItemButton, Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { AntSwitch } from "../../components/common/AntSwitch";
import { useArticles } from "../../hooks/useArticles";
import MarkdownRenderer from "../../components/Markdown/MarkdownRenderer";
import { Link, useNavigate } from "@tanstack/react-router";
import { TagChip } from "../../components/common/TagChip";

export const Drafts = () => {
    const [showUnpublishedOnly, setShowUnpublishedOnly] = useState(false);
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
    const { userArticles, userArticles_isLoading, rollbackArticle, deleteArticle } = useArticles();
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const articles = userArticles ?? [];

    const filteredDrafts = showUnpublishedOnly
        ? articles.filter(a => !a.is_published)
        : articles;

    // 選択された記事
    const selectedArticle = filteredDrafts.find(a => a.id === selectedArticleId);
    const handleRollback = (id: string, title: string) => {
        if (window.confirm(`「${title}」の編集内容を破棄して、公開中の状態に戻しますか？`)) {
            rollbackArticle(id);
        }
    };

    const handleDelete = (id: string, title: string) => {
        if (window.confirm(`「${title}」を完全に削除しますか？ゴミ箱へ移動します。`)) {
            deleteArticle(id);
        }
    };

    return (
        <Container
            sx={{
                mt: 4,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: { xs: 4, md: 3 },
                alignItems: { xs: "center", md: "flex-start" },
            }}
        >
            <Paper
                sx={{
                    width: { xs: "100%", sm: "450px" },
                    maxWidth: { xs: "100%", sm: "450px" },
                    height: "fit-content",
                    maxHeight: "80vh",
                    overflowY: "hidden",
                    display: "flex",
                    alignSelf: "flex-start",
                    position: "sticky",
                    flexDirection: "column",
                    top: "120px",
                    p: 2,
                }}
            >
                <Typography variant="subtitle1" mb={2}>
                    下書き一覧
                </Typography>

                <FormControlLabel
                    control={
                        <AntSwitch
                            checked={showUnpublishedOnly}
                            onChange={() => setShowUnpublishedOnly(!showUnpublishedOnly)}
                        />
                    }
                    label="未投稿の下書きのみ表示"
                />

                <List sx={{ mt: 2, overflowY: "scroll" }}>
                    {userArticles_isLoading ? (
                        <ListItem>
                            <ListItemText primary="読み込み中..." />
                        </ListItem>
                    ) : (
                        filteredDrafts.map(a => {
                            const hasDraftDiff = a.is_published && a.status === 'draft';
                            return (

                                <ListItemButton
                                    key={a.id}
                                    divider
                                    selected={a.id === selectedArticleId}
                                    onClick={() => {
                                        if (isSmall) {
                                            navigate({ to: "/drafts/$articleId/edit", params: { articleId: a.id } });
                                        } else {
                                            setSelectedArticleId(a.id);
                                        }
                                    }}
                                    sx={{ flexDirection: "column", alignItems: "flex-start", py: 1.5 }}
                                >
                                    <Box sx={{ display: "flex", gap: 1, width: "100%", mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {a.is_published && "公開済み"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            最終更新: {new Date(a.updated_at).toLocaleDateString()}
                                        </Typography>

                                    </Box>
                                    <ListItemText
                                        primary={a.title.trim() ? a.title : "タイトル未設定"}
                                        secondary={a.raw_content.trim() ? a.raw_content.substring(0, 50) + (a.raw_content.length > 50 ? "..." : "") : "本文未入力"}
                                    />
                                    <Box sx={{ display: "flex", gap: 1, width: "100%", mb: 0.5 }}>
                                        <Link
                                            to="/drafts/$articleId/edit"
                                            params={{
                                                articleId: a.id
                                            }}
                                        >
                                            <Button variant="outlined" onClick={(e) => e.stopPropagation()}>
                                                編集する
                                            </Button>
                                        </Link>
                                        {hasDraftDiff && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRollback(a.id, a.title);
                                                }}
                                            >
                                                下書きを削除する
                                            </Button>
                                        )}
                                        <Button variant="outlined" color="error" size="small" onClick={(e) => { e.stopPropagation(); handleDelete(a.id, a.title); }}>
                                            削除
                                        </Button>
                                    </Box>
                                </ListItemButton>
                            )
                        })
                    )}
                    {(!userArticles_isLoading && filteredDrafts.length === 0) && (
                        <ListItem>
                            <ListItemText primary="下書きはありません" />
                        </ListItem>
                    )}
                </List>

            </Paper>

            <Paper
                sx={{
                    mx: "auto",
                    flex: 1,
                    p: 2,
                    display: { xs: "none", sm: "none", md: "block" },
                    width: { md: "450px", lg: "600px", xl: "750px" },
                    maxWidth: { md: "450px", lg: "600px", xl: "750px" },
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", mt: 2, mb: 2 }}>
                    {selectedArticle?.title.trim() ? (
                        <Typography variant="h4">{selectedArticle?.title}</Typography>
                    ) : (
                        <Typography variant="h4" color="textDisabled">タイトル未設定</Typography>
                    )}
                    <Box px={4} mt={1} mb={1} display="flex" gap={1} flexWrap="wrap">
                        {selectedArticle?.article_tags.map((tagItem) => (
                            <TagChip key={tagItem.tags.id} tag={tagItem.tags} />
                        ))}
                    </Box>

                </Box>
                <MarkdownRenderer text={selectedArticle?.raw_content ?? ""} />
            </Paper>
        </Container>
    );
};
