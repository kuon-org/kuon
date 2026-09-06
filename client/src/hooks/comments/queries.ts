import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCommentIsLiked,
  fetchCommentLikeUsers,
  fetchComments,
} from "../../api/comments";
import { commentKeys } from "./keys";

export const useCommentsQuery = (articleId?: string) =>
  useQuery({
    queryKey: articleId ? commentKeys.list(articleId) : commentKeys.all,
    queryFn: () => fetchComments(articleId!),
    enabled: !!articleId,
  });

export const useCommentLikeUsersQuery = (articleId?: string, commentId?: string) =>
  useQuery({
    queryKey: commentId ? commentKeys.likeUsers(commentId) : commentKeys.all,
    queryFn: () => fetchCommentLikeUsers(articleId!, commentId!),
    enabled: !!articleId && !!commentId,
  });

export const useCommentIsLikedQuery = (articleId?: string, commentId?: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: commentId ? commentKeys.isLiked(commentId) : commentKeys.all,
    queryFn: () => fetchCommentIsLiked(articleId!, commentId!),
    enabled: !!articleId && !!commentId && !!queryClient.getQueryData(["authUser"]),
  });
};
