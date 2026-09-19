import { Container, Typography, Stack, Box, Divider } from "@mui/material";
import { useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/client";
import { AdvancedSearchBar } from "../../components/Search/SearchInput";
import { SearchPagination } from "../../components/Search/SearchPagination";
import { ArticleCard } from "../../components/Article/ArticleCard";
import { ArticlesSkeleton } from "../../components/common/Loading/ArticlesSkelton";
import { searchRoute } from "../../routes";

export const SearchPage = () => {
  const { t } = useTranslation("articles");
  const { q, page = 1 } = useSearch({ from: searchRoute.id });
  const { data, isLoading } = useQuery({
    queryKey: ["articles", "search", q, page],
    queryFn: async () => {
      const res = await apiClient.get("/articles", {
        params: { q, page, limit: 10 },
      });
      return res.data;
    },
    enabled: !!q,
  });

  return (
    <Container sx={{ mt: 4, mb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          {t("search.title")}
        </Typography>
        <AdvancedSearchBar initialValue={q} />
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        {q ? t("search.results", { query: q }) : t("search.enterKeyword")}
      </Typography>

      {isLoading ? (
        <Stack>
          {[...Array(5)].map((_, i) => (
            <ArticlesSkeleton key={i} />
          ))}
        </Stack>
      ) : (
        <>
          {data?.articles.length > 0 ? (
            <>
              <Stack>
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
                  {t("search.noResults")}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {t("search.noResultsHint")}
                </Typography>
              </Box>
            )
          )}
        </>
      )}
    </Container>
  );
};
