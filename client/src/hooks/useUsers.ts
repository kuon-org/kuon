import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { error, notify } = useNotify();
  const queryClient = useQueryClient();
  // ユーザ情報を取得
  const userQuery = useQuery<User>({
    queryKey: ["user", username],
    queryFn: async () => {
      const res = await apiClient.get<User>(`/users/${username}`);
      return res.data;
    },
    enabled: !!username, // usernameがある場合のみ実行
  });

  // userQueryの結果がある場合にのみ実行
  const isFollowingQuery = useQuery({
    queryKey: ["isFollowing", userQuery.data?.id],
    queryFn: async () => {
      const res = await apiClient.get(
        `/users/${userQuery.data!.id}/isfollowing`,
      );
      return res.data;
    },
    enabled: !!queryClient.getQueryData(["authUser"]), // userIdが確定してから実行
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

      notify(data.isFollow ? "フォローしました" : "フォロー解除しました");
    },
    onError: () => {
      error("フォローに失敗しました");
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
      error(getApiErrorMessage(apiError, "ピックアップ記事の設定に失敗しました"));
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
      error(getApiErrorMessage(apiError, "ピックアップ記事の設定に失敗しました"));
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
