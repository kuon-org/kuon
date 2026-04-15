import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import apiClient from "../api/client";
import { useNotify } from "./useNotify";
import { useAuthQuery } from "./useAuth";

// 基本的なリスト情報の型
export interface StockList {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "limited" | "private";
  created_at: string;
  updated_at: string;
  is_system: boolean;
  is_default: boolean;
  isStored?: boolean;
  users: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    bio?: string;
  };
  stock_list_tags: {
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  _count?: {
    stock_items: number;
    stock_list_likes: number;
  };
  totalCount?: number;
}
interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// リスト詳細（記事一覧を含む）の型
export interface StockListDetail extends StockList {
  stock_items: {
    id: string;
    created_at: string;
    articles: {
      id: string;
      title: string;
      created_at: string;
      like_count: number; // バックエンドで集計した値
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
  }[];
  pagination: Pagination;
}

export const useStocks = (
  articleId?: string,
  listId?: string,
  page: number = 1,
  q?: string,
) => {
  const queryClient = useQueryClient();
  const { success } = useNotify();
  const { user } = useAuthQuery();
  // 自分のリスト取得
  const {
    data: lists,
    isLoading,
    error,
  } = useQuery<StockList[]>({
    queryKey: ["stocks", "lists", articleId],
    queryFn: async () => {
      const params = articleId ? { articleId } : {};
      const { data } = await apiClient.get("/stocks/mylists", { params });
      return data;
    },
    retry: false,
    enabled: !!user,
  });

  const {
    data: publicLists,
    isLoading: isPublicListsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["stocks", "publicLists"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get("/stocks/lists", {
        params: { page: pageParam, limit: 10 },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // 🚀 追加: 特定のリスト詳細（記事一覧）取得
  const { data: listDetail, isLoading: isDetailLoading } =
    useQuery<StockListDetail>({
      // queryKey に page を含めることでページ切り替え時に再フェッチされる
      queryKey: ["stocks", "detail", listId ?? "all", page, q],
      queryFn: async () => {
        const endpoint = listId
          ? `/stocks/lists/${listId}`
          : "/stocks/alllists";
        const { data } = await apiClient.get(endpoint, {
          params: { page, limit: 10, q }, // ページとリミットを送信
        });
        return data;
      },
      enabled: listId ? true : !!user,
    });

  // 2. 記事の保存/解除 (トグル)
  const toggleMutation = useMutation({
    mutationFn: async (targetListId: string) => {
      const { data } = await apiClient.post(
        `/stocks/lists/${targetListId}/articles`,
        {
          articleId,
        },
      );
      return { listId: targetListId, ...data };
    },
    onSuccess: (data) => {
      success(data.message);
      queryClient.invalidateQueries({ queryKey: ["stocks", "lists"] });
      queryClient.invalidateQueries({ queryKey: ["stocks", "detail"] }); // 詳細も更新
    },
  });

  // 3. ストックリストの新規作成
  const createListMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      visibility?: "public" | "limited" | "private";
      tagIds?: string[];
    }) => {
      const { data } = await apiClient.post("/stocks/lists", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks", "lists"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async ({
      listId,
      payload,
    }: {
      listId: string;
      payload: {
        name: string;
        description?: string;
        visibility?: "public" | "limited" | "private";
        tagIds?: string[];
      };
    }) => {
      const { data } = await apiClient.patch(
        `/stocks/lists/${listId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks", "lists"] });
      queryClient.invalidateQueries({ queryKey: ["stocks", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { data } = await apiClient.delete(`/stocks/lists/${listId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks", "lists"] });
      queryClient.invalidateQueries({ queryKey: ["stocks", "detail"] });
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/stocks/default/articles`, {
        articleId,
      });
      return data;
    },
    onSuccess: (data) => {
      success(data.message);
      queryClient.invalidateQueries({ queryKey: ["stocks", "lists"] });
      queryClient.invalidateQueries({ queryKey: ["stocks", "detail"] });
    },
  });

  const stocksIsLikedQuery = useQuery({
    queryKey: ["stocks", "isLiked", listId],
    queryFn: async () => {
      if (!listId) throw new Error("ストックIDが指定されていません");
      const res = await apiClient.get(`/stocks/lists/${listId}/islike`);
      return res.data.isLiked as boolean;
    },
    enabled: !!listId && !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!listId) throw new Error("ストックIDが指定されていません");
      const res = await apiClient.post(`/stocks/lists/${listId}/like`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stocks", "isLiked", listId],
      });
      queryClient.invalidateQueries({ queryKey: ["stocks", "detail"] });
    },
  });

  // 🚀 便利プロパティの抽出
  const defaultList = lists?.find((l) => l.is_default);
  const isStoredInDefault = defaultList?.isStored ?? false;

  return {
    lists: lists ?? [],
    isLoading,
    error,
    defaultList,
    isStoredInDefault,
    publicLists: publicLists?.pages.flatMap((page) => page.lists) ?? [],
    publicLists_isLoading: isPublicListsLoading,
    publicLists_hasNextPage: hasNextPage,
    publicLists_fetchNextPage: fetchNextPage,
    publicLists_isFetchingNextPage: isFetchingNextPage,
    // 詳細データ
    listDetail,
    isDetailLoading,
    toggleStock: (targetListId: string) => toggleMutation.mutate(targetListId),
    isToggling: toggleMutation.isPending,
    createList: (payload: {
      name: string;
      description?: string;
      visibility?: "public" | "limited" | "private";
      tagIds?: string[];
    }) => createListMutation.mutateAsync(payload),
    isCreating: createListMutation.isPending,
    updateList: (params: {
      listId: string;
      payload: {
        name: string;
        description?: string;
        visibility?: "public" | "limited" | "private";
        tagIds?: string[];
      };
    }) => updateListMutation.mutateAsync(params),
    isUpdating: updateListMutation.isPending,
    toggleDefaultStock: () => toggleDefaultMutation.mutate(), // 🚀 追加
    deleteList: (listId: string) => deleteListMutation.mutate(listId),
    isDeleting: deleteListMutation.isPending,
    isLiked: stocksIsLikedQuery.data ?? false,
    isLikedLoading: stocksIsLikedQuery.isLoading,
    like: () => likeMutation.mutate(),
    isLiking: likeMutation.isPending,
  };
};
