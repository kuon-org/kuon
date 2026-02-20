import { Box, Tooltip, Typography } from "@mui/material";
import LeftSection from "../../components/layouts/SideSection/LeftSection";
import RightSection from "../../components/layouts/SideSection/RightSection";
import TocList from "../../components/Markdown/TocList";
import { useArticles } from "../../hooks/useArticles";
import Articles from "./Articles";
import { articleLikerRoute, articleRoute } from "../../router";
import { LikeButton } from "../../components/Like/LikeButton";
import { Link } from "@tanstack/react-router";
import { More } from "../../components/Markdown/More";
import { BottomBar } from "../../components/layouts/BottomBar/BottomBar";

export const ArticleLayout = () => {
    const { articleId } = articleRoute.useParams();
    const {
        article,
        isLoading,
        isError,
        error,
        mutateLike,
        isOwned,
        isLiked,
        likeCount,
        isLikePending,
    } = useArticles(articleId);

    return (
        <Box
            sx={{
                display: "flex",
                overflowY: "visible", // ← stickyが効くように変更
            }}
        >
            <LeftSection sticky>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <LikeButton
                        isLiked={isLiked}
                        isLikePending={isLikePending}
                        likeCount={likeCount}
                        mutateLike={mutateLike}
                    />

                    <Tooltip title="いいねした人一覧" placement="right">
                        <Link
                            to={articleLikerRoute.to}
                            params={{
                                username: article?.users.username ?? "",
                                articleId: articleId,
                            }}
                            style={{ color: "lightgray", textDecoration: 'none', }}
                        >
                            <Typography sx={{ color: "inherit", textDecoration: 'none', fontSize: "0.9rem", cursor: "pointer" }}>
                                {likeCount}
                            </Typography>
                        </Link>
                    </Tooltip>

                    <More
                        username={article?.users.username ?? ""}
                        articleId={articleId}
                        isOwned={isOwned}
                    />
                </div>
            </LeftSection>

            <Box className="markdown-scroll-container" sx={{ mx: "auto", flex: 1, py: 3, px: { sm: 0, md: 3}, width: { xs: "100vw", sm: "100vw" }, maxWidth: { md: "450px", lg: "750px", xl: "1200px" }, justifyContent: "center", }}>
                <Articles
                    article={article}
                    isLoading={isLoading}
                    isError={isError}
                    error={error}
                />
            </Box>

            <RightSection sticky>
                {isLoading ? (
                    <Typography variant="body2">読み込み中...</Typography>
                ) : (
                    article && <TocList content={article.render_content} />
                )}
            </RightSection>
            <BottomBar>
                <LikeButton
                    isLiked={isLiked}
                    isLikePending={isLikePending}
                    likeCount={likeCount}
                    mutateLike={mutateLike}
                />
                <More
                    username={article?.users.username ?? ""}
                    articleId={articleId}
                    isOwned={isOwned}
                />
            </BottomBar>
        </Box>
    );
};
