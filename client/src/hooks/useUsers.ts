import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useNotify } from "./useNotify";

export const useUserQuery = (username?: string) => {
  const { error, notify } = useNotify();
  const queryClient = useQueryClient();
  // ユーザ情報を取得
  const userQuery = useQuery({
    queryKey: ["user", username],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${username}`);
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
  };
};
