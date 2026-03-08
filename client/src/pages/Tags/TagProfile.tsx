import { useState } from "react"; // 👈 追加
import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  useTheme,
  Divider,
} from "@mui/material"; // 👈 Button, Collapseを追加
import { TagDetailCard } from "../../components/Tag/TagDetailCard";
import { tagProfileRoute } from "../../router";
import { useTagsQuery } from "../../hooks/useTags";
import Loading from "../../components/common/Loading/Loading";
import { TagArticles } from "../../components/Tag/TagArticles";

export const TagProfile = () => {
  const { slug } = tagProfileRoute.useParams();
  const { tag, tag_isLoading, tag_isError } = useTagsQuery(slug);
  const theme = useTheme();
  // 開閉状態を管理するState
  const [isExpanded, setIsExpanded] = useState(false);
  const fadeColor = theme.palette.background.paper;
  if (tag_isLoading) return <Loading />;
  if (tag_isError) return <>ERROR</>;
  if (!tag) return <>{slug}のタグは存在しません</>;

  return (
    <Container
      sx={{
        mt: 2,
        mb: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 4, md: 12 },
        alignItems: { xs: "center", md: "flex-start" },
      }}
    >
      <TagDetailCard tag={tag} slug={slug} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          mx: "auto",
          gap: 2,
          width: { xs: "100%", md: "auto" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Paper
            sx={{
              width: { xs: "100%", sm: "600px" },
              p: 2,
              minHeight: "100px",
              position: "relative", // 👈 ボタン配置の基準にするため
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
              {tag.name}とは？
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                position: "relative",
                maxHeight: isExpanded ? "none" : "120px", // 👈 閉じてる時の高さを制限
                overflow: "hidden",
                transition: "max-height 0.3s ease-out", // ふわっと開閉
                // 👇 下部を薄くするグラデーション
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: isExpanded ? 0 : "50px", // 👈 開いている時はグラデーションを消す
                  background: `linear-gradient(transparent, ${fadeColor})`,
                  transition: "height 0.3s ease",
                  pointerEvents: "none", // 下のテキストを選択できるように
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {tag.description}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{
                  fontWeight: "bold",
                }}
              >
                {isExpanded ? "閉じる" : "全て表示"}
              </Button>
            </Box>
          </Paper>
        </Box>
        <TagArticles tag={tag} />
      </Box>
    </Container>
  );
};
