import { Container, Paper, Typography, FormControlLabel, List, ListItem, ListItemText, ListItemButton, Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { AntSwitch } from "../../components/common/AntSwitch";
import { useArticles } from "../../hooks/useArticles";
import MarkdownRenderer from "../../components/Markdown/MarkdownRenderer";
import { Link, useNavigate } from "@tanstack/react-router";

export const Drafts = () => {
    const [showUnpublishedOnly, setShowUnpublishedOnly] = useState(false);
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
    const { userArticles, userArticles_isLoading } = useArticles();
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const articles = userArticles ?? [];

    const filteredDrafts = showUnpublishedOnly
        ? articles.filter(a => !a.is_published)
        : articles;

    // 選択された記事
    const selectedArticle = filteredDrafts.find(a => a.id === selectedArticleId);

    return (
        <Container
            sx={{
                mt: 2,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: { xs: 4, md: 12 },
                alignItems: { xs: "center", md: "flex-start" },
            }}
        >
            <Paper
                sx={{
                    width: { xs: "100%", sm: "360px" },
                    maxWidth: { xs: "100%", sm: "360px" },
                    minHeight: "400px",
                    display: "flex",
                    flexDirection: "column",
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

                <List>
                    {userArticles_isLoading ? (
                        <ListItem>
                            <ListItemText primary="読み込み中..." />
                        </ListItem>
                    ) : (
                        filteredDrafts.map(a => (
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
                                    primary={a.title}
                                    secondary={a.raw_content.substring(0, 50) + (a.raw_content.length > 50 ? "..." : "")}
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
                                    <>
                                        <Button variant="outlined" color="error" onClick={(e) => { e.stopPropagation(); }}>
                                            下書きを削除する
                                        </Button>
                                    </>
                                </Box>
                            </ListItemButton>
                        ))
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
                    p: 3,
                    display: { xs: "none", sm: "none", md: "block" },
                    maxWidth: { md: "450px", lg: "600px", xl: "600px" },
                }}
            >
                <MarkdownRenderer text={selectedArticle?.raw_content ?? ""} />
            </Paper>
        </Container>
    );
};
