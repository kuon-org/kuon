import { Container, Typography, Stack, Box, Divider } from "@mui/material";
import { useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";
import { AdvancedSearchBar } from "../../components/Search/SearchInput";
import { SearchPagination } from "../../components/Search/SearchPagination";
import { ArticleCard } from "../../components/Article/ArticleCard"; // 共通化したカード
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { searchRoute } from "../../router";

export const SearchPage = () => {
  // URLの ?q=... &page=... を取得
  const { q, page = 1 } = useSearch({ from: searchRoute.id });

  const { data, isLoading } = useQuery({
    queryKey: ["articles", "search", q, page],
    queryFn: async () => {
      const res = await apiClient.get("/articles", {
        params: { q, page, limit: 20 }, // 検索結果は20件ずつ
      });
      return res.data;
    },
    enabled: !!q, // クエリがあるときのみ実行
  });

  return (
    <Container sx={{ mt: 4, mb: 10 }}>
      {/* 検索入力セクション */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          詳細検索
        </Typography>
        <AdvancedSearchBar initialValue={q} />
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        {q ? `「${q}」の検索結果` : "検索キーワードを入力してください"}
      </Typography>

      {isLoading ? (
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      ) : (
        <>
          {data?.articles.length > 0 ? (
            <>
              <Stack spacing={2}>
                {data.articles.map((article: any) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </Stack>

              <SearchPagination
                totalCount={data.totalCount}
                totalPages={data.totalPages}
                currentPage={page}
                q={q}
              />
            </>
          ) : (
            q && (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Typography color="text.secondary">
                  一致する記事が見つかりませんでした。
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  キーワードを変えるか、タグ指定などを試してみてください。
                </Typography>
              </Box>
            )
          )}
        </>
      )}
    </Container>
  );
};
