import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchMyStockLists,
  fetchPublicStockLists,
  fetchStockListDetail,
  fetchStockListLike,
} from "../../api/stocks";
import { useAuthQuery } from "../useAuth";
import { stockKeys } from "./keys";

export const useStockLists = () => {
  const { user } = useAuthQuery();

  return useQuery({
    queryKey: stockKeys.myLists(),
    queryFn: () => fetchMyStockLists(),
    retry: false,
    enabled: !!user,
  });
};

export const useArticleStockLists = (
  articleId: string,
  enabled: boolean = true,
) => {
  const { user } = useAuthQuery();

  return useQuery({
    queryKey: stockKeys.articleLists(articleId),
    queryFn: () => fetchMyStockLists(articleId),
    retry: false,
    enabled: enabled && !!user && !!articleId,
  });
};

export const usePublicStockLists = () =>
  useInfiniteQuery({
    queryKey: stockKeys.publicLists(),
    queryFn: ({ pageParam = 1 }) => fetchPublicStockLists(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

export const useStockListDetail = (
  listId: string | undefined,
  page: number = 1,
  q?: string,
) => {
  const { user } = useAuthQuery();

  return useQuery({
    queryKey: stockKeys.detail(listId, page, q),
    queryFn: () => fetchStockListDetail(listId, page, q),
    enabled: listId ? true : !!user,
  });
};

export const useStockListLike = (listId?: string) => {
  const { user } = useAuthQuery();

  return useQuery({
    queryKey: stockKeys.like(listId ?? ""),
    queryFn: () => {
      if (!listId) throw new Error("ストックIDが指定されていません");
      return fetchStockListLike(listId);
    },
    enabled: !!listId && !!user,
  });
};
