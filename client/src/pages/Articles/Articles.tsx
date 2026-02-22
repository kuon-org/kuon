import { Avatar, Box, Chip, Paper, Typography } from "@mui/material";

import type { Article } from "../../hooks/useArticles";
import Markdown from "../../components/Markdown";
import { Link } from "@tanstack/react-router";
import { BottomUserCard } from "../../components/Article/BottomUserCard";
import { Comment } from "../../components/Article/Comment/Comment";

import { TagChip } from "../../components/common/TagChip";

interface ArticlesProps {
  article?: Article;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

const Articles = ({
  article,
  isLoading,
  isError,
  error,
}: ArticlesProps) => {
  if (isLoading) return <Typography>読み込み中…</Typography>;
  if (isError)
    return (
      <Typography color="error">
        エラー: {(error as Error)?.message ?? "不明なエラー"}
      </Typography>
    );
  if (!article) return <Typography>記事が見つかりません</Typography>;

  return (
    <>
      <Paper className="markdown-scroll-container"
        sx={{
          flex: 1,
          p: 3,
          backgroundColor: 'background.paper',
          scrollBehavior: 'smooth',
          width: { xs: "100vw", sm: "100vw" },
          maxWidth: { md: "450px", lg: "750px", xl: "1200px" }
        }}
      >

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            borderRadius: 2,
            gap: 2,
          }}
        >
          <Link
            to="/$username"
            params={{ username: article.users.username }}
            style={{ textDecoration: 'none', color: 'inherit', }}
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

              style={{ textDecoration: 'none', color: 'inherit', }}
            >
              <Box
                sx={{
                  display: "inline-block",
                  "&:hover *": { textDecoration: "underline" },
                  "&:focus *": { textDecoration: "underline" },
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  @{article.users.username} ({article.users.display_name})
                </Typography>

              </Box>
            </Link>


          </Box>
        </Box>

        {/* {article.article_tags.length > 0 && (
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
          )} */}
        {/* モックタグ */}
        {/* <Box px={4} mt={1} mb={1} display="flex" gap={1} flexWrap="wrap">
            {mockTags.map((m) => (
              <Chip
                key={m}
                label={m}
                size="small"
                color="default"
              />
            ))}
          </Box> */}

        <Box sx={{ display: "flex", flexDirection: "column", mt: 2, mb: 2 }}>
          <Typography variant="h4">{article.title}</Typography>
          <Box px={4} mt={1} mb={1} display="flex" gap={1} flexWrap="wrap">
            {article.article_tags.map((tagItem) => (
              <TagChip key={tagItem.tags.id} tag={tagItem.tags} />
            ))}
          </Box>
          <Typography variant="subtitle1" sx={{ fontSize: "0.75rem" }}>♡  {article.like_count}</Typography>
          <Box sx={{ display: "flex", gap: 1, verticalAlign: "center" }}>
            {article.updated_at && article.updated_at !== article.created_at && (
              <Typography variant="subtitle1" color="text.secondary">
                最終更新日 {new Date(article.updated_at).toLocaleDateString()}
              </Typography>
            )}
            <Typography variant="subtitle1" color="text.secondary">
              投稿日 {new Date(article.created_at).toLocaleDateString()}
            </Typography>
          </Box>

        </Box>

        <Markdown text={article.render_content} />

      </Paper>
      <Paper
        sx={{
          mt: 2,
          backgroundColor: 'background.paper',
          scrollBehavior: 'smooth',
          width: { xs: "100vw", sm: "100vw" },
          maxWidth: { md: "450px", lg: "750px", xl: "1200px" }
        }}
      >
        <BottomUserCard
          image_src=""
          username={article.users.username}
          display_name={article.users.display_name}
        />
      </Paper>
      <Paper
        sx={{
          mt: 2,
          backgroundColor: 'background.paper',
          scrollBehavior: 'smooth',
          width: { xs: "100vw", sm: "100vw" },
          maxWidth: { md: "450px", lg: "750px", xl: "1200px" }
        }}
      >
        <Comment articleId={article.id} />
      </Paper >

    </>
  );
};

export default Articles;
