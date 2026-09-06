import { Box, Tooltip, Typography } from "@mui/material";
import LeftSection from "../../components/layouts/SideSection/LeftSection";
import RightSection from "../../components/layouts/SideSection/RightSection";
import TocList from "../../components/Markdown/TocList";
import {
  useArticleIsLikedQuery,
  useArticleLikeUsersQuery,
  useArticleOwnershipQuery,
  useArticleQuery,
  useToggleArticleLike,
} from "../../hooks/articles";
import Articles from "./Articles";
import { articleLikerRoute, articleRoute } from "../../routes";
import { LikeButton } from "../../components/Like/LikeButton";
import { Link } from "@tanstack/react-router";
import { More } from "../../components/Markdown/More";
import { BottomBar } from "../../components/layouts/BottomBar/BottomBar";
import { CommentJump } from "../../components/Article/Comment/CommentJump";
import { StockButton } from "../../components/Stock/StockButton";
import { ShareButton } from "../../components/Article/ShareButton";

export const ArticleLayout = () => {
  const { articleId } = articleRoute.useParams();
  const articleQuery = useArticleQuery(articleId);
  const ownershipQuery = useArticleOwnershipQuery(articleId);
  const likeUsersQuery = useArticleLikeUsersQuery(articleId);
  const isLikedQuery = useArticleIsLikedQuery(articleId);
  const toggleLike = useToggleArticleLike(articleId);
  const article = articleQuery.data;
  const isOwned = ownershipQuery.data?.isOwned ?? false;
  const isLiked = isLikedQuery.data?.isLike ?? false;
  const likeCount = likeUsersQuery.data?.like_count ?? article?.like_count ?? 0;

  return (
    <Box
      sx={{
        display: "flex",
        overflowY: "visible",
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
            isLikePending={toggleLike.isPending}
            likeCount={likeCount}
            mutateLike={toggleLike.mutate}
          />
          <Tooltip title="いいねした人一覧" placement="right">
            <Link
              to={articleLikerRoute.to}
              params={{
                username: article?.users.username ?? "",
                articleId,
              }}
              style={{ color: "lightgray", textDecoration: "none" }}
            >
              <Typography
                sx={{
                  color: "inherit",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {likeCount}
              </Typography>
            </Link>
          </Tooltip>

          <StockButton key={articleId} articleId={articleId} />
          {article && (
            <ShareButton
              articleId={article.id}
              title={article.title}
              summary={article.summary}
            />
          )}
          <More
            username={article?.users.username ?? ""}
            articleId={articleId}
            isOwned={isOwned}
          />
        </div>
      </LeftSection>

      <Box
        className="markdown-scroll-container"
        sx={{
          mx: "auto",
          flex: 1,
          py: 3,
          px: { sm: 0, md: 3 },
          width: { xs: "100vw", sm: "100vw" },
          maxWidth: { md: "450px", lg: "750px", xl: "1000px" },
          justifyContent: "center",
        }}
      >
        <Articles article={article} isLoading={articleQuery.isLoading} />
      </Box>

      <RightSection sticky>
        {articleQuery.isLoading ? (
          <Typography variant="body2">読み込み中...</Typography>
        ) : (
          article && (
            <>
              <CommentJump articleId={articleId} />
              <TocList content={article.render_content} />
            </>
          )
        )}
      </RightSection>
      <BottomBar>
        <LikeButton
          isLiked={isLiked}
          isLikePending={toggleLike.isPending}
          likeCount={likeCount}
          mutateLike={toggleLike.mutate}
        />
        <StockButton key={articleId} articleId={articleId} />
        {article && (
          <ShareButton
            articleId={article.id}
            title={article.title}
            summary={article.summary}
          />
        )}
        <More
          username={article?.users.username ?? ""}
          articleId={articleId}
          isOwned={isOwned}
          content={article?.render_content}
        />
      </BottomBar>
    </Box>
  );
};
