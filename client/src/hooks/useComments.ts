import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useNotify } from "./useNotify";

// --- 型定義 ---
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

export interface CommentUser {
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface Comment {
  id: string;
  article_id: string;
  user_id: string | null;
  body: string | null;
  parent_comment_id: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  users: CommentUser | null;
  replies?: Comment[]; // フロントエンドでツリー化した後に追加される
}

// --- ヘルパー関数: フラットなリストをツリー構造に変換 ---
const convertToTree = (comments: Comment[]): Comment[] => {
  const map = new Map<string, Comment & { replies: Comment[] }>();
  const roots: Comment[] = [];

  // まず全てのコメントをマップに登録
  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  // 親子関係を構築
  map.forEach((node) => {
    if (node.parent_comment_id && map.has(node.parent_comment_id)) {
      map.get(node.parent_comment_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

// --- Hook 本体 ---
export const useComments = (articleId?: string, commentId?: string) => {
  const queryClient = useQueryClient();
  const { error } = useNotify();
  // 1. コメント一覧取得
  const commentsQuery = useQuery({
    queryKey: ["comments", articleId],
    queryFn: async () => {
      const res = await apiClient.get(`/articles/${articleId}/comments`);
      // 取得したデータをそのまま返すのではなく、ツリー構造に変換して返す
      return convertToTree(res.data as Comment[]);
    },
    enabled: !!articleId, // articleIdがある時だけ実行
  });

  // 2. コメント投稿 (新規 & 返信)
  const createCommentMutation = useMutation({
    mutationFn: async (payload: {
      body: string;
      parent_comment_id?: string | null;
    }) => {
      const res = await apiClient.post(
        `/articles/${articleId}/comments`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      // コメント一覧を最新に更新
      queryClient.invalidateQueries({ queryKey: ["comments", articleId] });
    },
    onError: (err: any) => {
      error(err.response?.data?.message ?? "コメントの投稿に失敗しました");
    },
  });

  const softDeleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiClient.delete(
        `/articles/${articleId}/comments/${commentId}`,
      );
      return res.data;
    },
    onSuccess: () => {
      // コメント一覧を最新に更新
      queryClient.invalidateQueries({ queryKey: ["comments", articleId] });
    },
  });

  const commentLikeUserQuery = useQuery<LikeUserResponse>({
    queryKey: ["commentLikeUser", commentId],
    queryFn: async () => {
      if (!commentId) throw new Error("コメントIDが指定されていません");
      const res = await apiClient.get(
        `/articles/${articleId}/comments/${commentId}/likes`,
      );
      return res.data as LikeUserResponse;
    },
    enabled: !!commentId,
  });

  const commentIsLikedQuery = useQuery<IsLikedResponse>({
    queryKey: ["commentIsLiked", commentId],
    queryFn: async () => {
      if (!commentId) throw new Error("コメントIDが指定されていません");
      const res = await apiClient.get(
        `/articles/${articleId}/comments/${commentId}/islike`,
      );
      return res.data as IsLikedResponse;
    },
    enabled: !!commentId && !!queryClient.getQueryData(["authUser"]),
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ isLike: boolean }>(
        `/articles/${articleId}/comments/${commentId}/like`,
      );
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["comment", commentId] });
      await queryClient.cancelQueries({
        queryKey: ["commentIsLiked", commentId],
      });
      await queryClient.cancelQueries({
        queryKey: ["commentLikeUser", commentId],
      });
      const prevComment = queryClient.getQueryData<Comment>([
        "comment",
        commentId,
      ]);
      const prevIsLiked = queryClient.getQueryData<IsLikedResponse>([
        "commentIsLiked",
        commentId,
      ]);
      if (prevComment && prevIsLiked) {
        const newLikeCount =
          prevComment.like_count + (prevIsLiked.isLike ? -1 : 1);
        queryClient.setQueryData<Comment>(["comment", commentId], {
          ...prevComment,
          like_count: newLikeCount,
        });
        queryClient.setQueryData<IsLikedResponse>(
          ["commentIsLiked", commentId],
          { isLike: !prevIsLiked.isLike },
        );
      }

      return { prevComment, prevIsLiked };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevComment)
        queryClient.setQueryData(["comment", commentId], context.prevComment);
      if (context?.prevIsLiked)
        queryClient.setQueryData(
          ["commentIsLiked", commentId],
          context.prevIsLiked,
        );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment", commentId] });
      queryClient.invalidateQueries({
        queryKey: ["commentLikeUser", commentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["commentIsLiked", commentId],
      });
    },
  });

  return {
    // データ
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    isError: commentsQuery.isError,
    likeUsers: commentLikeUserQuery.data?.like_users ?? [],
    likeCount: commentLikeUserQuery.data?.like_count ?? 0,
    isLiked: commentIsLikedQuery.data?.isLike ?? false,
    isLikePending: likeMutation.isPending,
    mutateLike: likeMutation.mutate,

    // アクション
    postComment: createCommentMutation.mutate,
    isPosting: createCommentMutation.isPending,
    softDelete: softDeleteCommentMutation.mutate,
    softDelete_isPending: softDeleteCommentMutation.isPending,

    // 再取得用
    refetchComments: commentsQuery.refetch,
  };
};
