import {
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    CircularProgress,
    Box,
    Avatar,
} from "@mui/material";
import { Link } from '@tanstack/react-router';
import { useArticles } from "../../hooks/useArticles";



const mockTag = "Test";
const mockTag2 = "Test2";

const mockTags = [mockTag, mockTag2]


const Home = () => {
    const { articles, articles_isLoading: isLoading, articles_isError: isError } = useArticles();

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

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                記事一覧
            </Typography>

            {!articles || articles.length === 0 ? (
                <Typography>記事がありません</Typography>
            ) : (
                <Stack spacing={2}>
                    {articles.map((article) => (
                        <Link
                            to="/$username/$articleId"
                            params={{
                                username: article.users.username,
                                articleId: article.id,
                            }}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            <Card key={article.id} variant="outlined"
                                sx={{
                                    borderRadius: 2, // 通常の角丸
                                    width: "auto",   // デフォルト幅
                                    '@media (max-width:600px)': { // sm以下
                                        width: '100vw',
                                        borderRadius: 0.5,
                                        mx: '-16px', // Containerのpaddingを打ち消す
                                    },
                                }}
                            >
                                <CardContent>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            borderRadius: 2,
                                            bgcolor: "background.paper",
                                            gap: 2,
                                        }}
                                    >
                                        <Link
                                            to="/$username"
                                            params={{ username: article.users.username }}
                                            style={{ textDecoration: "none", color: "inherit" }}
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
                                            >
                                                <Box
                                                    sx={{
                                                        "&:hover *": { textDecoration: "underline" },
                                                        "&:focus *": { textDecoration: "underline" },
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{
                                                        fontWeight: "bold",
                                                        "&:hover *": { textDecoration: "underline" },
                                                        "&:focus *": { textDecoration: "underline" },
                                                    }}>
                                                        @{article.users.username} ({article.users.display_name})
                                                    </Typography>
                                                </Box>
                                            </Link>

                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(article.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ px: 4 }}>
                                        <Typography variant="h6">{article.title}</Typography>
                                        {/* <Typography variant="body2" color="text.secondary" mb={1}>
                                            {article.summary}
                                        </Typography> */}
                                    </Box>

                                    {article.article_tags.length > 0 && (
                                        <Box mb={1} display="flex" gap={1} flexWrap="wrap">
                                            {article.article_tags.map((tagItem) => (
                                                <Chip
                                                    key={tagItem.tags.id}
                                                    label={tagItem.tags.name}
                                                    size="small"
                                                    color="primary"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                    {/* モックタグ */}
                                    <Box px={4} mt={1} mb={1} display="flex" gap={1} flexWrap="wrap">
                                        {mockTags.map((m) => (
                                            <Chip
                                                key={m}
                                                label={m}
                                                size="small"
                                                color="default"
                                            />
                                        ))}
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        ♡ {" "}
                                        {article.like_count}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </Stack>
            )}
        </Container>
    );
};

export default Home;
