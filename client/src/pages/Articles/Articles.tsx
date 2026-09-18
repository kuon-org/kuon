import { Avatar, Box, Paper, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { Article } from "../../hooks/articles";
import Markdown from "../../components/Markdown";
import { BottomUserCard } from "../../components/Article/BottomUserCard";
import { Comment } from "../../components/Article/Comment/Comment";
import { TagChip } from "../../components/common/TagChip";

interface ArticlesProps {
  article?: Article;
  isLoading: boolean;
}

const Articles = ({ article, isLoading }: ArticlesProps) => {
  const { t, i18n } = useTranslation("articles");

  if (isLoading) return <Typography>{t("status.loading")}</Typography>;
  if (!article) return <Typography>{t("status.notFound")}</Typography>;

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <>
      <Paper
        className="markdown-scroll-container"
        sx={{
          flex: 1,
          p: 3,
          mx: "auto",
          scrollBehavior: "smooth",
          width: { xs: "100vw", sm: "100vw" },
          maxWidth: { md: "450px", lg: "750px", xl: "1000px" },
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", borderRadius: 2, gap: 2 }}>
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
            {article.groups && <Typography component="span" variant="subtitle2">
              {" in "}<Link to="/groups/$slug" params={{ slug: article.groups.slug }} search={{ page: 1 }} style={{ color: "inherit", fontWeight: "bold" }}>{article.groups.display_name}</Link>
            </Typography>}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", mt: 2, mb: 2 }}>
          <Typography variant="h4">{article.title}</Typography>
          <Box mt={1} mb={1} display="flex" gap={1} flexWrap="wrap">
            {article.article_tags.map((tagItem) => (
              <TagChip key={tagItem.tags.id} tag={tagItem.tags} />
            ))}
          </Box>
          <Typography variant="subtitle1" sx={{ fontSize: "0.75rem" }}>
            ♡ {article.like_count}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1,
              verticalAlign: "center",
            }}
          >
            {article.updated_at && article.updated_at !== article.created_at && (
              <Typography variant="subtitle2" color="text.secondary">
                {t("dates.updatedAt", { date: formatDateTime(article.updated_at) })}
              </Typography>
            )}
            <Typography variant="subtitle2" color="text.secondary">
              {t("dates.createdAt", { date: formatDateTime(article.created_at) })}
            </Typography>
          </Box>
        </Box>

        <Markdown text={article.render_content} />
      </Paper>
      <Paper
        sx={{
          mt: 2,
          mx: "auto",
          backgroundColor: "background.paper",
          scrollBehavior: "smooth",
          width: { xs: "100vw", sm: "100vw" },
          maxWidth: { md: "450px", lg: "750px", xl: "1000px" },
        }}
      >
        <BottomUserCard
          image_src={article.users.avatar_url}
          username={article.users.username}
          display_name={article.users.display_name}
          bio={article.users.bio}
        />
      </Paper>
      <Paper
        sx={{
          mt: 2,
          mx: "auto",
          backgroundColor: "background.paper",
          scrollBehavior: "smooth",
          width: { xs: "100vw", sm: "100vw" },
          maxWidth: { md: "450px", lg: "750px", xl: "1000px" },
        }}
      >
        <Comment articleId={article.id} />
      </Paper>
    </>
  );
};

export default Articles;
