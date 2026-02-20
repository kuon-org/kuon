// hooks/useArticles.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useNavigate } from "@tanstack/react-router";

interface Tag {
    id: string;
    name: string;
    slug: string;
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
    summary: string;
    is_published: boolean;
    users: {
        username: string;
        display_name: string;
        avatar_url: string;
    }
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
    like_count: number;
    article_tags: ArticleTag[]


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
}

export interface EditArticleData {
    title: string;
    content: string;
    summary: string;
    isPublished: boolean;
}

export const useArticles = (articleId?: string) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const createArticleMutation = useMutation({
        mutationFn: async (newArticle: CreateArticleData) => {
            const res = await apiClient.post("/articles/create", newArticle);
            return res.data;
        },
        onSuccess: () => {
            alert("記事を作成しました！");
            queryClient.invalidateQueries({ queryKey: ["articles"] });
            navigate({ to: "/" });
        },
        onError: (err: any) => {
            console.error(err);
            alert(err.response?.data?.message ?? "作成中にエラーが発生しました");
        },
    });
    const editArticleMutation = useMutation({
        mutationFn: async (editArticle: EditArticleData) => {
            const res = await apiClient.put(`/articles/${articleId}/edit`, editArticle);
            return res.data;
        },
        onSuccess: () => {
            alert("記事を更新しました！");
            queryClient.invalidateQueries({ queryKey: ["articles"] });
            queryClient.invalidateQueries({ queryKey: ["article", articleId] });
            navigate({ to: "/" });
        },
        onError: (err: any) => {
            console.error(err);
            alert(err.response?.data?.message ?? "更新中にエラーが発生しました");
        },
    });
    // 📰 記事詳細の取得
    const articleQuery = useQuery({
        queryKey: ["article", articleId],
        queryFn: async () => {
            const { data } = await apiClient.get<Article>(`/articles/${articleId}`);
            console.log(data)
            return data;
        },
        enabled: !!articleId,
        staleTime: 1000 * 30, // キャッシュを30秒保持
    });
    const articlesQuery = useQuery({
        queryKey: ["articles"],
        queryFn: async () => {
            const { data } = await apiClient.get<Articles[]>(`/articles`);
            return data;
        },

    })
    const getisOwned = useQuery({
        queryKey: ["isOwned", articleId],
        queryFn: async () => {
            const res = await apiClient.get<isOwnedResponse>(`/articles/${articleId}/isowned`);
            return res.data;
        },
        enabled: !!articleId,
    })

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
        enabled: !!articleId,
    });

    // 💬 いいねトグルミューテーション
    const likeMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post<{ isLike: boolean }>(
                `/articles/${articleId}/like`
            );
            return data;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["article", articleId] });
            await queryClient.cancelQueries({ queryKey: ["articleIsLiked", articleId] });
            await queryClient.cancelQueries({ queryKey: ["articleLikeUser", articleId] });

            const prevArticle = queryClient.getQueryData<Article>(["article", articleId]);
            const prevIsLiked = queryClient.getQueryData<IsLikedResponse>([
                "articleIsLiked",
                articleId,
            ]);

            if (prevArticle && prevIsLiked) {
                const newLikeCount = prevArticle.like_count + (prevIsLiked.isLike ? -1 : 1);
                queryClient.setQueryData<Article>(["article", articleId], {
                    ...prevArticle,
                    like_count: newLikeCount,
                });
                queryClient.setQueryData<IsLikedResponse>(
                    ["articleIsLiked", articleId],
                    { isLike: !prevIsLiked.isLike }
                );
            }

            return { prevArticle, prevIsLiked };
        },
        onError: (_err, _vars, context) => {
            if (context?.prevArticle)
                queryClient.setQueryData(["article", articleId], context.prevArticle);
            if (context?.prevIsLiked)
                queryClient.setQueryData(["articleIsLiked", articleId], context.prevIsLiked);
        },
        onSuccess: () => {
            // 成功時に再フェッチ
            queryClient.invalidateQueries({ queryKey: ["article", articleId] });
            queryClient.invalidateQueries({ queryKey: ["articleLikeUser", articleId] });
            queryClient.invalidateQueries({ queryKey: ["articleIsLiked", articleId] });
        },
    });

    const userArticlesQuery = useQuery({
        queryKey: ["UserArticles"],
        queryFn: async () => {
            const { data } = await apiClient.get<UserArticles[]>(`/articles/me`);
            return data;
        }
    })
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
            alert(err.response?.data?.message ?? "画像アップロードに失敗しました");
        },
    });

    return {
        // 記事関連
        createArticle: createArticleMutation.mutate,
        isCreating: createArticleMutation.isPending,

        editArticle: editArticleMutation.mutate,
        isEditing: editArticleMutation.isPending,
        articles: articlesQuery.data,
        articles_isLoading: articlesQuery.isLoading,
        articles_isError: articlesQuery.isError,
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
    };
};
