import apiClient from "./client";

export interface LikeUser {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
}

export interface LikeUserResponse {
  like_users: LikeUser[];
  like_count: number;
}

export interface IsLikedResponse {
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
  replies?: Comment[];
}

export interface CreateCommentPayload {
  body: string;
  parent_comment_id?: string | null;
}

const convertToTree = (comments: Comment[]): Comment[] => {
  const map = new Map<string, Comment & { replies: Comment[] }>();
  const roots: Comment[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  map.forEach((node) => {
    if (node.parent_comment_id && map.has(node.parent_comment_id)) {
      map.get(node.parent_comment_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const fetchComments = async (articleId: string) => {
  const { data } = await apiClient.get<Comment[]>(
    `/articles/${articleId}/comments`,
  );
  return convertToTree(data);
};

export const createComment = async (
  articleId: string,
  payload: CreateCommentPayload,
) => {
  const { data } = await apiClient.post(
    `/articles/${articleId}/comments`,
    payload,
  );
  return data;
};

export const softDeleteComment = async (
  articleId: string,
  commentId: string,
) => {
  const { data } = await apiClient.delete(
    `/articles/${articleId}/comments/${commentId}`,
  );
  return data;
};

export const fetchCommentLikeUsers = async (
  articleId: string,
  commentId: string,
) => {
  const { data } = await apiClient.get<LikeUserResponse>(
    `/articles/${articleId}/comments/${commentId}/likes`,
  );
  return data;
};

export const fetchCommentIsLiked = async (
  articleId: string,
  commentId: string,
) => {
  const { data } = await apiClient.get<IsLikedResponse>(
    `/articles/${articleId}/comments/${commentId}/islike`,
  );
  return data;
};

export const toggleCommentLike = async (
  articleId: string,
  commentId: string,
) => {
  const { data } = await apiClient.post<{ isLike: boolean }>(
    `/articles/${articleId}/comments/${commentId}/like`,
  );
  return data;
};
