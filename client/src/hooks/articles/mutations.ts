import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  createArticle,
  deleteArticle,
  editArticle,
  hardDeleteArticle,
  restoreArticle,
  rollbackArticle,
  toggleArticleLike,
  uploadArticleImage,
} from "../../api/articles";
import type {
  Article,
  CreateArticleData,
  EditArticleData,
  IsLikedResponse,
} from "../../api/articles";
import type { ApiError } from "../../api/FetchHttpClient";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useNotify } from "../useNotify";
import { articleKeys } from "./keys";

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation("articles");
  const { error } = useNotify();

  return useMutation({
    mutationFn: (payload: CreateArticleData) => createArticle(payload),
    onSuccess: (data) => {
      navigate({
        to: "/drafts/$articleId/edit",
        params: { articleId: data.id },
        replace: true,
      });
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      queryClient.invalidateQueries({ queryKey: articleKeys.mine() });
    },
    onError: (apiError: ApiError) => {
      console.error(apiError);
      error(getApiErrorMessage(apiError, t("notifications.createFailed")));
    },
  });
};

export const useEditArticle = (articleId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  const { error } = useNotify();

  return useMutation({
    mutationFn: (payload: EditArticleData) => editArticle(articleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleKeys.mine() });
    },
    onError: (apiError: ApiError) => {
      console.error(apiError);
      error(getApiErrorMessage(apiError, t("notifications.updateFailed")));
    },
  });
};

export const useToggleArticleLike = (articleId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  const { error, success } = useNotify();

  return useMutation({
    mutationFn: () => toggleArticleLike(articleId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: articleKeys.detail(articleId) });
      await queryClient.cancelQueries({ queryKey: articleKeys.isLiked(articleId) });
      await queryClient.cancelQueries({ queryKey: articleKeys.likeUsers(articleId) });

      const prevArticle = queryClient.getQueryData<Article>(articleKeys.detail(articleId));
      const prevIsLiked = queryClient.getQueryData<IsLikedResponse>(articleKeys.isLiked(articleId));

      if (prevArticle && prevIsLiked) {
        queryClient.setQueryData<Article>(articleKeys.detail(articleId), {
          ...prevArticle,
          like_count: prevArticle.like_count + (prevIsLiked.isLike ? -1 : 1),
        });
        queryClient.setQueryData<IsLikedResponse>(articleKeys.isLiked(articleId), {
          isLike: !prevIsLiked.isLike,
        });
      }

      return { prevArticle, prevIsLiked };
    },
    onError: (_error, _variables, context) => {
      error(t("notifications.likeFailed"));
      if (context?.prevArticle) {
        queryClient.setQueryData(articleKeys.detail(articleId), context.prevArticle);
      }
      if (context?.prevIsLiked) {
        queryClient.setQueryData(articleKeys.isLiked(articleId), context.prevIsLiked);
      }
    },
    onSuccess: (data) => {
      success(data.isLike ? t("notifications.liked") : t("notifications.unliked"));
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: articleKeys.likeUsers(articleId) });
      queryClient.invalidateQueries({ queryKey: articleKeys.isLiked(articleId) });
    },
  });
};

export const useUploadArticleImage = () => {
  const { t } = useTranslation("articles");
  const { error } = useNotify();

  return useMutation({
    mutationFn: uploadArticleImage,
    onError: (apiError: ApiError) => {
      console.error(apiError);
      error(getApiErrorMessage(apiError, t("notifications.uploadFailed")));
    },
  });
};

export const useRollbackArticle = (articleId?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  const { success } = useNotify();

  return useMutation({
    mutationFn: rollbackArticle,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.mine() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(articleId ?? id) });
      success(t("notifications.rollbackSuccess"));
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  const { error, success } = useNotify();

  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      queryClient.invalidateQueries({ queryKey: articleKeys.mine() });
      queryClient.invalidateQueries({ queryKey: articleKeys.trash() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
      success(t("notifications.deleteSuccess"));
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, t("notifications.deleteFailed")));
    },
  });
};

export const useRestoreArticle = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  const { success } = useNotify();

  return useMutation({
    mutationFn: restoreArticle,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      queryClient.invalidateQueries({ queryKey: articleKeys.mine() });
      queryClient.invalidateQueries({ queryKey: articleKeys.trash() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
      success(t("notifications.restoreSuccess"));
    },
  });
};

export const useHardDeleteArticle = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("articles");
  const { success } = useNotify();

  return useMutation({
    mutationFn: hardDeleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.trash() });
      success(t("notifications.hardDeleteSuccess"));
    },
  });
};
