// hooks/useArticles.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import apiClient from "../api/client";
import { useNotify } from "./useNotify";

interface Tag {
  id: string;
  name: string;
  slug: string;
  avatar_url: string;
}

interface ArticleTag {
  tags: Tag;
}

interface Articles {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  created_at: string;
  like_count: number;
  article_tags: ArticleTag[];
  users: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface Article {
  id: string;
  title: string;
  raw_content: string;
  render_content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  summary: string;
  is_published: boolean;
  is_private: boolean;
  users: {
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
  };
  article_tags: ArticleTag[];
}

export interface UserArticles {
  id: string;
  user_id: string;
  title: string;
  raw_content: string;
  render_content: string;
  summary: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_published: boolean;
  is_private: boolean;
  like_count: number;
  article_tags: ArticleTag[];
}

interface LikeUser {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
}

interface LikeUserResponse {
  like_users: LikeUser[];
  like_count: number;
}

interface IsLikedResponse {
  isLike: boolean;
}

export interface isOwnedResponse {
  isOwned: boolean;
}

export interface CreateArticleData {
  title: string;
  content: string;
  summary: string;
  isPublished: boolean;
  isPrivate: boolean;
  tagIds: string[]; // 追加
}

export interface EditArticleData {
  title: string;
  content: string;
  summary: string;
  isPublished: boolean;
  isPrivate: boolean;
  tagIds: string[]; // 追加
}

interface PaginatedArticles {
  articles: Articles[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export const useArticles = (articleId?: string) => {
  const queryClient = useQueryClient();
  const { error, success } = useNotify();
  const createArticleMutation = useMutation({
    mutationFn: async (newArticle: CreateArticleData) => {
      const res = await apiClient.post("/articles/create", newArticle);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["UserArticles"] });
    },
    onError: (err: any) => {
      console.error(err);
    },
  });
  const editArticleMutation = useMutation({
    mutationFn: async (editArticle: EditArticleData) => {
      const res = await apiClient.patch(
        `/articles/${articleId}/edit`,
        editArticle,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      queryClient.invalidateQueries({ queryKey: ["UserArticles"] });
    },
    onError: (err: any) => {
      console.error(err);
    },
  });
  // 📰 記事詳細の取得
  const articleQuery = useQuery({
    queryKey: ["article", articleId],
    queryFn: async () => {
      const { data } = await apiClient.get<Article>(`/articles/${articleId}`);
      return data;
    },
    enabled: !!articleId,
    staleTime: 1000 * 30, // キャッシュを30秒保持
  });
  // const articlesQuery = useQuery({
  //     queryKey: ["articles"],
  //     queryFn: async () => {
  //         const { data } = await apiClient.get<Articles[]>(`/articles`);
  //         return data;
  //     },

  // })
  const articlesInfiniteQuery = useInfiniteQuery({
    queryKey: ["articles"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedArticles>(`/articles`, {
        params: {
          page: pageParam,
          limit: 10,
        },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      // 現在のページが総ページ数より少なければ次のページ番号を返す
      return lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const recommendArticlesInfiniteQuery = useInfiniteQuery({
    queryKey: ["recommends"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedArticles>(
        `/articles/recommends`,
        {
          params: {
            page: pageParam,
            limit: 10,
          },
        },
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      // 現在のページが総ページ数より少なければ次のページ番号を返す
      return lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const trendArticlesInifiniteQuery = useInfiniteQuery({
    queryKey: ["trends"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedArticles>(
        `/articles/trends`,
        {
          params: {
            page: pageParam,
            limit: 10,
          },
        },
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      // 現在のページが総ページ数より少なければ次のページ番号を返す
      return lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const getisOwned = useQuery({
    queryKey: ["isOwned", articleId],
    queryFn: async () => {
      const res = await apiClient.get<isOwnedResponse>(
        `/articles/${articleId}/isowned`,
      );
      return res.data;
    },
    enabled: !!articleId && !!queryClient.getQueryData(["authUser"]),
  });

  // ❤️ 記事にいいねしたユーザー一覧と件数
  const articleLikeUserQuery = useQuery<LikeUserResponse>({
    queryKey: ["articleLikeUser", articleId],
    queryFn: async () => {
      if (!articleId) throw new Error("記事IDが指定されていません");
      const res = await apiClient.get(`/articles/${articleId}/likes`);
      return res.data as LikeUserResponse;
    },
    enabled: !!articleId,
  });

  // ⭐ 現在のユーザーがいいねしているかどうか
  const articleIsLikedQuery = useQuery<IsLikedResponse>({
    queryKey: ["articleIsLiked", articleId],
    queryFn: async () => {
      if (!articleId) throw new Error("記事IDが指定されていません");
      const res = await apiClient.get(`/articles/${articleId}/islike`);
      return res.data as IsLikedResponse;
    },
    enabled: !!articleId && !!queryClient.getQueryData(["authUser"]),
  });

  // 💬 いいねトグルミューテーション
  const likeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{
        isLike: boolean;
        message: string;
      }>(`/articles/${articleId}/like`);
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["article", articleId] });
      await queryClient.cancelQueries({
        queryKey: ["articleIsLiked", articleId],
      });
      await queryClient.cancelQueries({
        queryKey: ["articleLikeUser", articleId],
      });

      const prevArticle = queryClient.getQueryData<Article>([
        "article",
        articleId,
      ]);
      const prevIsLiked = queryClient.getQueryData<IsLikedResponse>([
        "articleIsLiked",
        articleId,
      ]);

      if (prevArticle && prevIsLiked) {
        const newLikeCount =
          prevArticle.like_count + (prevIsLiked.isLike ? -1 : 1);
        queryClient.setQueryData<Article>(["article", articleId], {
          ...prevArticle,
          like_count: newLikeCount,
        });
        queryClient.setQueryData<IsLikedResponse>(
          ["articleIsLiked", articleId],
          { isLike: !prevIsLiked.isLike },
        );
      }

      return { prevArticle, prevIsLiked };
    },
    onError: (_err, _vars, context) => {
      error("いいねに失敗しました。");
      if (context?.prevArticle)
        queryClient.setQueryData(["article", articleId], context.prevArticle);
      if (context?.prevIsLiked)
        queryClient.setQueryData(
          ["articleIsLiked", articleId],
          context.prevIsLiked,
        );
    },
    onSuccess: (data) => {
      // 成功時に再フェッチ
      success(data.message);
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      queryClient.invalidateQueries({
        queryKey: ["articleLikeUser", articleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["articleIsLiked", articleId],
      });
    },
  });

  const userArticlesQuery = useQuery({
    queryKey: ["UserArticles"],
    queryFn: async () => {
      const { data } = await apiClient.get<UserArticles[]>(`/articles/me`);
      return data;
    },
    enabled: !!queryClient.getQueryData(["authUser"]),
  });
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post("/articles/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as { url: string };
    },
    onError: (err: any) => {
      console.error(err);
      error(err.response?.data?.message ?? "画像アップロードに失敗しました");
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/articles/${id}/rollback`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["UserArticles"] });
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      success("下書きを破棄して公開済みの状態に戻しました");
    },
  });
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/articles/${id}`);
      return res.data;
    },
    onSuccess: (_data, id) => {
      // 🚀 公開一覧、マイ記事一覧、ゴミ箱一覧をすべて更新
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["UserArticles"] });
      queryClient.invalidateQueries({ queryKey: ["TrashArticles"] });
      // 詳細表示中に削除した場合のために詳細も無効化
      queryClient.invalidateQueries({ queryKey: ["article", id] });
      success("記事を削除しました");
    },
    onError: (err: any) => {
      error(err.response?.data?.message ?? "削除に失敗しました");
    },
  });

  const trashArticlesQuery = useQuery({
    queryKey: ["TrashArticles"],
    queryFn: async () => {
      const res = await apiClient.get<UserArticles[]>("/articles/trash/list");
      return res.data;
    },
    enabled: !!queryClient.getQueryData(["authUser"]),
  });

  // 復元 mutation
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/articles/${id}/restore`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["UserArticles"] });
      queryClient.invalidateQueries({ queryKey: ["TrashArticles"] });
      queryClient.invalidateQueries({ queryKey: ["article", id] });
      success("記事を復元しました");
    },
  });

  // 物理削除 mutation
  const hardDeleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/articles/${id}/hard`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["TrashArticles"] });
      success("記事を完全に削除しました");
    },
  });

  return {
    // 記事関連
    createArticle: createArticleMutation.mutateAsync,
    isCreating: createArticleMutation.isPending,

    editArticle: editArticleMutation.mutateAsync,
    isEditing: editArticleMutation.isPending,
    // articles: articlesQuery.data,
    // articles_isLoading: articlesQuery.isLoading,
    // articles_isError: articlesQuery.isError,
    /** 修正 */
    articles:
      articlesInfiniteQuery.data?.pages.flatMap((page) => page.articles) ?? [], // 全ページの全記事をフラットに展開
    articles_isLoading: articlesInfiniteQuery.isLoading,
    articles_isError: articlesInfiniteQuery.isError,
    hasNextPage: articlesInfiniteQuery.hasNextPage, // 次のページがあるか
    isFetchingNextPage: articlesInfiniteQuery.isFetchingNextPage, // 追加読み込み中か
    fetchNextPage: articlesInfiniteQuery.fetchNextPage,
    /** */

    recommendArticles:
      recommendArticlesInfiniteQuery.data?.pages.flatMap(
        (page) => page.articles,
      ) ?? [],
    recommendArticlesIsLoading: recommendArticlesInfiniteQuery.isLoading,
    recommendArticlesIsError: recommendArticlesInfiniteQuery.isError,
    recommendArticlesHasNextPage: recommendArticlesInfiniteQuery.hasNextPage,
    recommendArticlesFetchingNextPage:
      recommendArticlesInfiniteQuery.isFetchingNextPage,
    recommendArticlesFetchNextPage:
      recommendArticlesInfiniteQuery.fetchNextPage,

    trendArticles:
      trendArticlesInifiniteQuery.data?.pages.flatMap(
        (page) => page.articles,
      ) ?? [],
    trendArticlesIsLoading: trendArticlesInifiniteQuery.isLoading,
    trendArticlesIsError: trendArticlesInifiniteQuery.isError,
    trendArticlesHasNextPage: trendArticlesInifiniteQuery.hasNextPage,
    trendArticlesIsFetchingNextPage:
      trendArticlesInifiniteQuery.isFetchingNextPage,
    trendArticlesFetchNextPage: trendArticlesInifiniteQuery.fetchNextPage,

    article: articleQuery.data,
    isOwned: getisOwned.data?.isOwned ?? false,
    isLoading: articleQuery.isLoading,
    isError: articleQuery.isError,
    error: articleQuery.error,

    // 個人記事一覧
    userArticles: userArticlesQuery.data,
    userArticles_isLoading: userArticlesQuery.isLoading,

    // いいね関連
    likeUsers: articleLikeUserQuery.data?.like_users ?? [],
    likeCount: articleLikeUserQuery.data?.like_count ?? 0,
    isLiked: articleIsLikedQuery.data?.isLike ?? false,
    isLikePending: likeMutation.isPending,
    mutateLike: likeMutation.mutate,

    // 再取得用
    refetchArticle: articleQuery.refetch,
    refetchLikeUsers: articleLikeUserQuery.refetch,
    refetchIsLiked: articleIsLikedQuery.refetch,

    uploadImage: uploadImageMutation.mutateAsync,

    rollbackArticle: rollbackMutation.mutate,
    isRollingBack: rollbackMutation.isPending,
    deleteArticle: deleteArticleMutation.mutate,
    isDeleting: deleteArticleMutation.isPending,

    trashArticles: trashArticlesQuery.data,
    trash_isLoading: trashArticlesQuery.isLoading,
    restoreArticle: restoreMutation.mutate,
    hardDeleteArticle: hardDeleteMutation.mutate,
  };
};
