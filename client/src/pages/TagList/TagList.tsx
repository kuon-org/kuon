import {
  Box,
  Grid,
  Card,
  Typography,
  CircularProgress,
  Avatar,
  Paper,
} from "@mui/material";
import { useTagsQuery } from "../../hooks/useTags";
import { useNavigate } from "@tanstack/react-router";
import { tagProfileRoute } from "../../routes";

// APIのデータ構造に合わせた型定義
interface Tag {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  articleCount: number;
  followCount: number;
}

const TagList = () => {
  const { tags, tags_isLoading, tags_isError } = useTagsQuery();
  const navigate = useNavigate();
  if (tags_isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tags_isError) {
    return (
      <Typography color="error" align="center" sx={{ mt: 8 }}>
        タグの取得中にエラーが発生しました。
      </Typography>
    );
  }

  const handleNavigate = (slug: string) => {
    navigate({
      to: tagProfileRoute.to,
      params: {
        slug: slug,
      },
      search: {
        page: 1,
      },
    });
  };

  return (
    <Paper sx={{ mt: 2, mx: "auto", width: { md: 1100 }, p: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={4}>
        タグ一覧
      </Typography>

      <Grid container spacing={1}>
        {tags.map((tag: Tag) => (
          // xs: 12 (1列), sm: 6 (2列), md: 3 (4列)
          <Grid size={{ xs: 6, sm: 6, md: 3 }} key={tag.id}>
            <Card
              variant="outlined"
              onClick={() => handleNavigate(tag.slug)}
              sx={{
                height: 30, // 30px固定
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                px: 1,
                borderRadius: "6px",
                backgroundColor: "background.paper",
                transition: "0.2s",
                cursor: "pointer",
                "&:hover": {
                  boxShadow: 1,
                  borderColor: "primary.light",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                },
              }}
            >
              {/* 1. 画像 (avatar_urlがnullの場合は名前の1文字目) */}
              <Avatar
                src={tag.avatar_url || undefined}
                sx={{
                  width: 20,
                  height: 20,
                  mr: 1,
                  fontSize: "0.65rem",
                  bgcolor: "white",
                  color: "text.primary",
                }}
              >
                {tag.name.substring(0, 1)}
              </Avatar>

              {/* 2. 名前 (溢れる場合は...で省略) */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  flexGrow: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tag.name}
              </Typography>

              {/* 3. 記事数 (articleCount) */}
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  ml: 0.5,
                  minWidth: "fit-content",
                }}
              >
                （{tag.articleCount}記事）
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default TagList;
