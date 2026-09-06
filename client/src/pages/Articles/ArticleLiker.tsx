import { Box, Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { useArticleLikeUsersQuery, useArticleQuery } from "../../hooks/articles";
import { articleRoute } from "../../routes";
import { Link } from "@tanstack/react-router";
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton";

export const ArticleLiker = () => {
  const { articleId } = articleRoute.useParams();
  const articleQuery = useArticleQuery(articleId);
  const likeUsersQuery = useArticleLikeUsersQuery(articleId);
  const likeUsers = likeUsersQuery.data?.like_users ?? [];
  const article = articleQuery.data;
  return (
    <Paper
      elevation={2}
      sx={{
        mt: 4,
        width: { xs: "80vw", sm: "60vw" },
        display: "flex",
        mx: "auto",
        flexDirection: "column",
      }}
    >
      <Typography sx={{ mt: 2, ml: 2 }}>
        <Link
          to={articleRoute.to}
          params={{
            username: article?.users.username ?? "",
            articleId,
          }}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Box
            sx={{
              display: "inline-block",
              "&:hover *": { textDecoration: "underline" },
              "&:focus *": { textDecoration: "underline" },
            }}
          >
            <Typography>{article?.title}</Typography>
          </Box>
        </Link>{" "}
        にいいねした人
      </Typography>
      {articleQuery.isLoading || likeUsersQuery.isLoading ? <LoadingSkelton /> : <UserList users={likeUsers}></UserList>}
    </Paper>
  );
};
