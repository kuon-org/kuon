import {
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    CircularProgress,
    Box,
    Avatar,
} from "@mui/material";
import { Link, useNavigate } from '@tanstack/react-router';
import { useArticles } from "../../hooks/useArticles";
import { TagChip } from "../../components/common/TagChip";

const Home = () => {
    const { articles, articles_isLoading: isLoading, articles_isError: isError } = useArticles();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <Container sx={{ textAlign: "center", mt: 5 }}>
                <CircularProgress />
                <Typography variant="body1" mt={2}>
                    読み込み中…
                </Typography>
            </Container>
        );
    }

    if (isError) {
        return (
            <Container sx={{ textAlign: "center", mt: 5 }}>
                <Typography color="error">
                    記事の取得に失敗しました
                </Typography>
            </Container>
        );
    }

    // ユーザー名やアバターをクリックしたときにカード全体のクリックイベントを発火させないための関数
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                記事一覧
            </Typography>

            {!articles || articles.length === 0 ? (
                <Typography>記事がありません</Typography>
            ) : (
                <Stack spacing={{ sm: 0, md: 2 }}>
                    {articles.map((article) => (
                        <Card
                            key={article.id}
                            variant="outlined"
                            onClick={() => {
                                navigate({
                                    to: "/$username/$articleId",
                                    params: {
                                        username: article.users.username,
                                        articleId: article.id,
                                    }
                                });
                            }}
                            sx={{
                                cursor: "pointer",
                                borderRadius: 2,
                                mt: 1,
                                width: "auto",
                                transition: "background-color 0.2s",
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                                '@media (max-width:600px)': {
                                    width: '100vw',
                                    borderRadius: 0.5,
                                    mx: '-16px',
                                },
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        borderRadius: 2,
                                        bgcolor: "transparent", // hover時の背景透過を維持
                                        gap: 2,
                                        mb: 1
                                    }}
                                >
                                    {/* 内側のリンクは onClick に stopPropagation を追加 */}
                                    <Link
                                        to="/$username"
                                        params={{ username: article.users.username }}
                                        style={{ textDecoration: "none", color: "inherit" }}
                                        onClick={stopPropagation}
                                    >
                                        <Avatar
                                            src={article.users.avatar_url}
                                            alt={article.users.display_name}
                                            sx={{ width: 32, height: 32, bgcolor: "grey.200" }}
                                        />
                                    </Link>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Link
                                            to="/$username"
                                            params={{ username: article.users.username }}
                                            style={{ textDecoration: "none", color: "inherit" }}
                                            onClick={stopPropagation}
                                        >
                                            <Box
                                                sx={{
                                                    display: "inline-block",
                                                    "&:hover": { textDecoration: "underline" },
                                                }}
                                            >
                                                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                                    @{article.users.username} ({article.users.display_name})
                                                </Typography>
                                            </Box>
                                        </Link>

                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {new Date(article.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ px: { xs: 0, sm: 4 } }}>
                                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                        {article.title}
                                    </Typography>
                                </Box>

                                {/* タグ */}
                                <Box
                                    sx={{ px: { xs: 0, sm: 4 }, mt: 1, mb: 1, display: "flex", gap: 1, flexWrap: "wrap" }}
                                    onClick={stopPropagation} // タグクリック時も親に飛ばさない
                                >
                                    {article.article_tags.map((tagItem) => (
                                        <TagChip key={tagItem.tags.id} tag={tagItem.tags} />
                                    ))}
                                </Box>

                                <Box sx={{ px: { xs: 0, sm: 4 } }}>
                                    <Typography variant="caption" color="text.secondary">
                                        ♡ {article.like_count}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Container>
    );
};

export default Home;