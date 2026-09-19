import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchArticle,
  fetchArticleIsLiked,
  fetchArticleLikeUsers,
  fetchArticleOwnership,
  fetchArticles,
  fetchMarp,
  fetchRecommendedArticles,
  fetchTrashArticles,
  fetchTrendArticles,
  fetchUserArticles,
} from "../../api/articles";
import { articleKeys } from "./keys";

const getNextPageParam = (lastPage: {
  currentPage: number;
  totalPages: number;
}) =>
  lastPage.currentPage < lastPage.totalPages
    ? lastPage.currentPage + 1
    : undefined;

export const useArticleQuery = (articleId?: string) =>
  useQuery({
    queryKey: articleId ? articleKeys.detail(articleId) : articleKeys.all,
    queryFn: () => fetchArticle(articleId!),
    enabled: !!articleId,
    staleTime: 1000 * 30,
    throwOnError: true,
  });

export const useArticlesInfiniteQuery = () =>
  useInfiniteQuery({
    queryKey: articleKeys.all,
    queryFn: ({ pageParam = 1 }) => fetchArticles(pageParam),
    getNextPageParam,
    initialPageParam: 1,
  });

export const useRecommendedArticlesInfiniteQuery = () =>
  useInfiniteQuery({
    queryKey: articleKeys.recommends(),
    queryFn: ({ pageParam = 1 }) => fetchRecommendedArticles(pageParam),
    getNextPageParam,
    initialPageParam: 1,
  });

export const useTrendArticlesInfiniteQuery = () =>
  useInfiniteQuery({
    queryKey: articleKeys.trends(),
    queryFn: ({ pageParam = 1 }) => fetchTrendArticles(pageParam),
    getNextPageParam,
    initialPageParam: 1,
  });

export const useArticleOwnershipQuery = (articleId?: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: articleId ? articleKeys.ownership(articleId) : articleKeys.all,
    queryFn: () => fetchArticleOwnership(articleId!),
    enabled: !!articleId && !!queryClient.getQueryData(["authUser"]),
  });
};

export const useArticleLikeUsersQuery = (articleId?: string) =>
  useQuery({
    queryKey: articleId ? articleKeys.likeUsers(articleId) : articleKeys.all,
    queryFn: () => fetchArticleLikeUsers(articleId!),
    enabled: !!articleId,
  });

export const useArticleIsLikedQuery = (articleId?: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: articleId ? articleKeys.isLiked(articleId) : articleKeys.all,
    queryFn: () => fetchArticleIsLiked(articleId!),
    enabled: !!articleId && !!queryClient.getQueryData(["authUser"]),
  });
};

export const useUserArticlesQuery = () => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: articleKeys.mine(),
    queryFn: fetchUserArticles,
    enabled: !!queryClient.getQueryData(["authUser"]),
  });
};

export const useTrashArticlesQuery = () => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: articleKeys.trash(),
    queryFn: fetchTrashArticles,
    enabled: !!queryClient.getQueryData(["authUser"]),
  });
};

export const useMarpQuery = (articleId?: string, enabled = true) =>
  useQuery({
    queryKey: articleId ? articleKeys.marp(articleId) : articleKeys.all,
    queryFn: () => fetchMarp(articleId!),
    enabled: enabled && !!articleId,
  });
