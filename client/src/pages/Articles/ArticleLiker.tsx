import { Box, Paper, Typography } from "@mui/material";
import { UserList } from "../../components/UserList/UserList";
import { useArticles } from "../../hooks/useArticles";
import { articleRoute } from "../../routes";
import { Link } from "@tanstack/react-router";
import LoadingSkelton from "../../components/common/Loading/LoadingSkelton";

export const ArticleLiker = () => {
  const { articleId } = articleRoute.useParams();
  const { likeUsers, article, isLoading } = useArticles(articleId);
  console.log(likeUsers.length);
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
            articleId: articleId,
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
            <Typography> {article?.title}</Typography>
          </Box>
        </Link>{" "}
        にいいねした人
      </Typography>
      {isLoading ? <LoadingSkelton /> : <UserList users={likeUsers}></UserList>}
    </Paper>
  );
};
