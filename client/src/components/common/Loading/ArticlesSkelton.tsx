import { Skeleton, Card, CardContent, Box } from "@mui/material";

// 記事1枚分のスケルトン
export const ArticlesSkeleton = () => (
  <Card
    sx={{
      mb: 2,
      boxShadow: "none",
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        {/* アバター部分 */}
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ ml: 2 }}>
          {/* ユーザー名と日付 */}
          <Skeleton variant="text" width={100} height={20} />
          <Skeleton variant="text" width={60} height={15} />
        </Box>
      </Box>
      {/* タイトル */}
      <Skeleton variant="rectangular" width="80%" height={28} sx={{ mb: 1 }} />
      {/* タグといいね */}
      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Skeleton variant="rounded" width={50} height={24} />
        <Skeleton variant="rounded" width={50} height={24} />
      </Box>
    </CardContent>
  </Card>
);
