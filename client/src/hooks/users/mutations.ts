import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { ApiError } from "../../api/FetchHttpClient";
import { createPickupArticle, deletePickupArticle, followUser } from "../../api/users";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useNotify } from "../useNotify";
import { userKeys } from "./keys";

export const useFollowUser = (userId?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("users");
  const { error, notify } = useNotify();
  return useMutation({
    mutationFn: followUser,
    onSuccess: (data, followeeId) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.followingState(followeeId) }),
        queryClient.invalidateQueries({ queryKey: userKeys.following(userId) }),
        queryClient.invalidateQueries({ queryKey: userKeys.followers(followeeId) }),
      ]);
      notify(data.isFollow ? t("notifications.followed") : t("notifications.unfollowed"));
    },
    onError: () => error(t("notifications.followFailed")),
  });
};

export const useCreatePickupArticle = (userId?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("users");
  const { error } = useNotify();
  return useMutation({
    mutationFn: createPickupArticle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.pickup(userId) }),
    onError: (apiError: ApiError) => error(getApiErrorMessage(apiError, t("pickup.configFailed"))),
  });
};

export const useDeletePickupArticle = (userId?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("users");
  const { error } = useNotify();
  return useMutation({
    mutationFn: deletePickupArticle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.pickup(userId) }),
    onError: (apiError: ApiError) => error(getApiErrorMessage(apiError, t("pickup.configFailed"))),
  });
};
