import { Link, useSearch } from "@tanstack/react-router";
import { tagProfileRoute } from "../../routes";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";
import {
  Typography,
  Stack,
  Box,
  Pagination,
  PaginationItem,
} from "@mui/material";
import { ArticlesSkeleton } from "../common/Loading/ArticlesSkelton";
import { ArticleCard } from "../Article/ArticleCard";
import type { Tag } from "../../hooks/tags";
import { useTranslation } from "react-i18next";

interface TagArticlesProps {
  tag: Tag;
}

export const TagArticles = ({ tag }: TagArticlesProps) => {
  const { t } = useTranslation("tags");
  const { page = 1 } = useSearch({ from: tagProfileRoute.id });
  const { slug } = tagProfileRoute.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["articles", "tag", tag.id, page],
    queryFn: async () => {
      const res = await apiClient.get("/articles", {
        params: { tagId: tag.id, page, limit: 10 },
      });
      return res.data;
    },
  });

  return (
    <>
      <Box sx={{ mb: 1, width: { xs: "100%", sm: "600px" } }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
          {t("articles.title", { name: tag.name })}
        </Typography>
      </Box>
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
              <Pagination
                count={data.totalPages}
                page={page}
                variant="outlined"
                shape="rounded"
                sx={{ mx: "auto" }}
                renderItem={(item) =>
                  item.disabled ? (
                    <PaginationItem {...item} />
                  ) : (
                    <Link
                      to={tagProfileRoute.to}
                      search={{ page: item.page ?? 1 }}
                      params={{ slug }}
                    >
                      <PaginationItem {...item} />
                    </Link>
                  )
                }
              />
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 10 }}>
              <Typography color="text.secondary">
                {t("articles.empty")}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {t("articles.emptyHint")}
              </Typography>
            </Box>
          )}
        </>
      )}
    </>
  );
};
