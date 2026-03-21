import { Box, Card, CardContent, Avatar, Typography } from "@mui/material";
import { Link, useNavigate } from "@tanstack/react-router";
import { TagChip } from "../common/TagChip";
import { StockButton } from "../Stock/StockButton";

// propsの型定義（既存のArticlesインターフェースに合わせる）
interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    created_at: string;
    like_count: number;
    users: {
      username: string;
      display_name: string;
      avatar_url: string;
    };
    article_tags: {
      tags: {
        id: string;
        name: string;
        slug: string;
      };
    }[];
  };
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const navigate = useNavigate();

  // 子要素（アバターやタグ）クリック時にカード全体の遷移を発火させない
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  const handleNavigate = () => {
    navigate({
      to: "/$username/$articleId",
      params: {
        username: article.users.username,
        articleId: article.id,
      },
    });
  };
  return (
    <Card
      variant="outlined"
      onClick={handleNavigate}
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        mt: 1,
        width: "auto",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: "action.hover",
        },
        "@media (max-width:600px)": {
          width: "auto",
          borderRadius: 0.5,
          mx: "-16px",
        },
      }}
    >
      <CardContent>
        {/* ユーザー情報ヘッダー */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 1,
          }}
        >
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

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {new Date(article.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* タイトル */}
        <Box sx={{ px: { xs: 0, sm: 4 } }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {article.title}
          </Typography>
        </Box>

        {/* タグ */}
        <Box
          sx={{
            px: { xs: 0, sm: 4 },
            mt: 1,
            mb: 1,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
          onClick={stopPropagation}
        >
          {article.article_tags.map((tagItem) => (
            <TagChip key={tagItem.tags.id} tag={tagItem.tags} />
          ))}
        </Box>

        <Box
          sx={{
            px: {
              xs: 0,
              sm: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
          }}
        >
          <Typography variant="caption" color="text.secondary">
            ♡ {article.like_count}
          </Typography>
          <Box onClick={stopPropagation}>
            <StockButton key={article.id} articleId={article.id} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
