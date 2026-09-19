import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  softDeleteComment,
  toggleCommentLike,
} from "../../api/comments";
import type {
  Comment,
  CreateCommentPayload,
  IsLikedResponse,
} from "../../api/comments";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useNotify } from "../useNotify";
import { commentKeys } from "./keys";

export const useCreateComment = (articleId: string) => {
  const queryClient = useQueryClient();
  const { error } = useNotify();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      createComment(articleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(articleId) });
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, "コメントの投稿に失敗しました"));
    },
  });
};

export const useSoftDeleteComment = (articleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => softDeleteComment(articleId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(articleId) });
    },
  });
};

export const useToggleCommentLike = (articleId: string, commentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleCommentLike(articleId, commentId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: commentKeys.detail(commentId),
      });
      await queryClient.cancelQueries({
        queryKey: commentKeys.isLiked(commentId),
      });
      await queryClient.cancelQueries({
        queryKey: commentKeys.likeUsers(commentId),
      });

      const prevComment = queryClient.getQueryData<Comment>(
        commentKeys.detail(commentId),
      );
      const prevIsLiked = queryClient.getQueryData<IsLikedResponse>(
        commentKeys.isLiked(commentId),
      );

      if (prevComment && prevIsLiked) {
        queryClient.setQueryData<Comment>(commentKeys.detail(commentId), {
          ...prevComment,
          like_count: prevComment.like_count + (prevIsLiked.isLike ? -1 : 1),
        });
        queryClient.setQueryData<IsLikedResponse>(
          commentKeys.isLiked(commentId),
          {
            isLike: !prevIsLiked.isLike,
          },
        );
      }

      return { prevComment, prevIsLiked };
    },
    onError: (_error, _variables, context) => {
      if (context?.prevComment) {
        queryClient.setQueryData(
          commentKeys.detail(commentId),
          context.prevComment,
        );
      }
      if (context?.prevIsLiked) {
        queryClient.setQueryData(
          commentKeys.isLiked(commentId),
          context.prevIsLiked,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.detail(commentId),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.likeUsers(commentId),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.isLiked(commentId),
      });
      queryClient.invalidateQueries({ queryKey: commentKeys.list(articleId) });
    },
  });
};
