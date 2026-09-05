import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import apiClient from "../api/client";
import type { ApiError } from "../api/FetchHttpClient";
import { getApiErrorMessage } from "../utils/errorHelpers";
import { useNotify } from "./useNotify";

interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login_at: string;
  created_by: any;
}

interface Ranking {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  contribution: number;
}
export const useUserQuery = (username?: string, userId?: string) => {
  const { t } = useTranslation("users");
  const { error, notify } = useNotify();
  const queryClient = useQueryClient();
  const userQuery = useQuery<User>({
    queryKey: ["user", username],
    queryFn: async () => {
      const res = await apiClient.get<User>(`/users/${username}`);
      return res.data;
    },
    enabled: !!username,
  });

  const isFollowingQuery = useQuery({
    queryKey: ["isFollowing", userQuery.data?.id],
    queryFn: async () => {
      const res = await apiClient.get(
        `/users/${userQuery.data!.id}/isfollowing`,
      );
      return res.data;
    },
    enabled: !!queryClient.getQueryData(["authUser"]),
  });

  const getFollowing = useQuery({
    queryKey: ["following", userQuery.data?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userQuery.data!.id}/follow`);
      return res.data;
    },
  });

  const getFollower = useQuery({
    queryKey: ["follower", userQuery.data?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userQuery.data!.id}/follower`);
      return res.data;
    },
  });

  const getCommentCount = useQuery({
    queryKey: ["commentCount", userQuery.data?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userQuery.data!.id}/comments`);
      return res.data.commentCount;
    },
  });
  const getArticleCount = useQuery({
    queryKey: ["articleCount", userQuery.data?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userQuery.data!.id}/articles`);
      return res.data.articleCount;
    },
  });

  const followMutation = useMutation({
    mutationFn: async (followeeId: string) => {
      const res = await apiClient.post("/users/follow", { followeeId });
      return res.data;
    },
    onSuccess: (data, followeeId) => {
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", followeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["following", followeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["follower", followeeId],
      });

      notify(data.isFollow ? t("notifications.followed") : t("notifications.unfollowed"));
    },
    onError: () => {
      error(t("notifications.followFailed"));
    },
  });
  const getPickupArticles = useQuery({
    queryKey: ["pickup", userId],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userId}/pickup`);
      return res.data;
    },
    enabled: !!userId,
  });

  const createPickupArticles = useMutation({
    mutationFn: async (articleId: string) => {
      const res = await apiClient.post("/users/pickup/create", {
        articleId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup", userId] });
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, t("pickup.configFailed")));
    },
  });

  const deletePickupArticles = useMutation({
    mutationFn: async (articleId: string) => {
      const res = await apiClient.post("/users/pickup/delete", {
        articleId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup", userId] });
    },
    onError: (apiError: ApiError) => {
      error(getApiErrorMessage(apiError, t("pickup.configFailed")));
    },
  });

  const allRanking = useQuery<Ranking[]>({
    queryKey: ["allranking"],
    queryFn: async () => {
      const res = await apiClient.get("/users/ranking/all");
      return res.data;
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isFollowing: isFollowingQuery.data,
    isFollowingLoading: isFollowingQuery.isLoading,
    isFollowingError: isFollowingQuery.isError,
    follow: followMutation.mutate,
    following: getFollowing.data,
    following_isLoading: getFollowing.isLoading,
    following_count: getFollowing.data?.length ?? 0,
    follower: getFollower.data,
    follower_isLoading: getFollower.isLoading,
    follower_count: getFollower.data?.length ?? 0,

    pickup: getPickupArticles.data,
    pickupIsLoading: getPickupArticles.isLoading,
    pickupIsError: getPickupArticles.isError,

    createPickup: createPickupArticles.mutateAsync,
    deletePickup: deletePickupArticles.mutateAsync,

    commentCount: getCommentCount.data,
    commentCountIsLoading: getCommentCount.isLoading,

    articleCount: getArticleCount.data,
    articleCountIsLoading: getArticleCount.isLoading,

    ranking: allRanking.data,
    rankingIsLoading: allRanking.isLoading,
  };
};
