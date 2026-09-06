import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import apiClient from "../api/client";
import type { ApiError } from "../api/FetchHttpClient";
import { getApiErrorMessage } from "../utils/errorHelpers";
import { useNotify } from "./useNotify";
import { useAuthUserQuery } from "./auth";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url: string;
  articleCount: number;
  followCount: number;
}

export interface Tags {
  id: string;
  name: string;
  slug: string;
  avatar_url: string;
  articleCount: number;
  followCount: number;
}

export interface UpsertTagData {
  name: string;
  slug: string;
  avatar_url?: string | null;
  description?: string;
}

export interface FollowingTags {
  id: string;
  name: string;
  slug: string;
  avatar_url: string;
  description: string;
  created_at: string;
}

export interface UserFollowingTags {
  tags: FollowingTags[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export const useTagsQuery = (slug?: string, userId?: string, page?: number) => {
  const { t } = useTranslation("tags");
  const queryClient = useQueryClient();
  const { notify, error } = useNotify();
  const authUserQuery = useAuthUserQuery();
  const user = authUserQuery.data;
  const tagsQuery = useQuery<Tags[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data } = await apiClient.get("/tags");
      return data;
    },
  });

  const getTagQuery = useQuery<Tag>({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tags/${slug}`);
      return data;
    },
    enabled: !!slug,
  });

  const upsertTagMutation = useMutation({
    mutationFn: async (newTag: UpsertTagData) => {
      const res = await apiClient.post("/tags", newTag);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tag", slug] });
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, t("notifications.saveFailed")));
    },
  });

  const getFollowingTags = useQuery<UserFollowingTags>({
    queryKey: ["followingTags", userId, page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/users/${userId}/following_tags`, {
        params: { page: 1, limit: 20 },
      });
      return data;
    },
    enabled: !!userId,
  });

  const getMyFollowingTags = useQuery<FollowingTags[]>({
    queryKey: ["myFollowingTags"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/tags/me");
      return data;
    },
    enabled: !!user,
  });

  const getIsFollowing = useQuery({
    queryKey: ["isFollowingTag", slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tags/${slug}/isFollowing`);
      return data;
    },
    enabled: !!user && !!slug,
  });

  const followMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiClient.post(`/tags/${slug}/follow`);
      return res.data;
    },
    onSuccess: (data, slug) => {
      queryClient.invalidateQueries({
        queryKey: ["isFollowingTag", slug],
      });
      queryClient.invalidateQueries({
        queryKey: ["myFollowingTags"],
      });
      notify(data.isFollowing ? t("notifications.followed") : t("notifications.unfollowed"));
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post(
        `/tags/${slug}/upload_avatar`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return res.data as { url: string };
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, t("notifications.uploadFailed")));
    },
  });

  return {
    tags: tagsQuery.data ?? [],
    tags_isLoading: tagsQuery.isLoading,
    tags_isError: tagsQuery.isError,
    tag: getTagQuery.data,
    tag_isLoading: getTagQuery.isLoading,
    tag_isError: getTagQuery.isError,
    upsertTag: upsertTagMutation.mutateAsync,
    isUpserting: upsertTagMutation.isPending,
    uploadImage: uploadImageMutation.mutateAsync,
    followingTags: getFollowingTags.data,
    followingTagsIsLoading: getFollowingTags.isLoading,
    followingTagsIsError: getFollowingTags.isError,
    myFollowingTags: getMyFollowingTags.data,
    myFollowingTagsIsLoading: getMyFollowingTags.isLoading,
    myFollowingTagsIsError: getMyFollowingTags.isError,

    isFollowing: getIsFollowing.data,
    isFollowingIsLoading: getIsFollowing.isLoading,
    isFollowingIsError: getIsFollowing.isError,

    followTag: followMutation.mutateAsync,
    followTagIsPending: followMutation.isPending,
  };
};
