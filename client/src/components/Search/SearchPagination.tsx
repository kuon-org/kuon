import {
  Pagination,
  PaginationItem,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { Link } from "@tanstack/react-router";

interface Props {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  q: string;
}

export const SearchPagination = ({
  totalCount,
  totalPages,
  currentPage,
  q,
}: Props) => {
  // Qiita風に最大100ページ制限を表示に反映
  const displayPages = Math.min(totalPages, 100);
  const startIdx = (currentPage - 1) * 20 + 1;
  const endIdx = Math.min(currentPage * 20, totalCount);

  return (
    <Box sx={{ mt: 4, mb: 8 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ mb: 2 }}
      >
        {totalCount.toLocaleString()}件の検索結果 {startIdx}~{endIdx}
        件目を表示中
      </Typography>

      <Stack alignItems="center">
        <Pagination
          count={displayPages}
          page={currentPage}
          variant="outlined"
          shape="rounded"
          renderItem={(item) => (
            <Link
              to="/search"
              search={{ q, page: item.page ?? 1 }}
              style={{ textDecoration: "none" }}
            >
              <PaginationItem {...item} />
            </Link>
          )}
        />
      </Stack>

      {totalPages > 100 && (
        <Typography
          variant="caption"
          display="block"
          align="center"
          sx={{ mt: 2, color: "text.secondary" }}
        >
          ※
          検索結果は最大100ページまでしか表示できません。検索オプションで記事を絞り込めます。
        </Typography>
      )}
    </Box>
  );
};
