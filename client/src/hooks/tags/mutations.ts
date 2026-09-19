import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { ApiError } from "../../api/FetchHttpClient";
import { toggleTagFollow, upsertTag, uploadTagAvatar } from "../../api/tags";
import { getApiErrorMessage } from "../../utils/errorHelpers";
import { useNotify } from "../useNotify";
import { tagKeys } from "./keys";

export const useUpsertTag = (slug?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("tags");
  const { error } = useNotify();
  return useMutation({
    mutationFn: upsertTag,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tagKeys.list() }),
        queryClient.invalidateQueries({ queryKey: tagKeys.detail(slug) }),
      ]);
    },
    onError: (apiError: ApiError) =>
      error(getApiErrorMessage(apiError, t("notifications.saveFailed"))),
  });
};

export const useToggleTagFollow = (slug?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("tags");
  const { notify } = useNotify();
  return useMutation({
    mutationFn: toggleTagFollow,
    onSuccess: async (data, targetSlug) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tagKeys.followState(targetSlug),
        }),
        queryClient.invalidateQueries({ queryKey: tagKeys.myFollowing() }),
        queryClient.invalidateQueries({
          queryKey: tagKeys.detail(slug ?? targetSlug),
        }),
      ]);
      notify(
        data.isFollow
          ? t("notifications.followed")
          : t("notifications.unfollowed"),
      );
    },
  });
};

export const useUploadTagAvatar = (slug: string) => {
  const { t } = useTranslation("tags");
  const { error } = useNotify();
  return useMutation({
    mutationFn: (file: File) => uploadTagAvatar(slug, file),
    onError: (apiError: ApiError) =>
      error(getApiErrorMessage(apiError, t("notifications.uploadFailed"))),
  });
};
