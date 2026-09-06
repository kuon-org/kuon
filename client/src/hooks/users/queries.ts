import { useQuery } from "@tanstack/react-query";
import {
  fetchFollowers,
  fetchFollowing,
  fetchIsFollowing,
  fetchPickupArticles,
  fetchUser,
  fetchUserArticleCount,
  fetchUserCommentCount,
  fetchUserRanking,
} from "../../api/users";
import { userKeys } from "./keys";

export const useUserQuery = (username?: string) =>
  useQuery({
    queryKey: userKeys.detail(username),
    queryFn: () => fetchUser(username!),
    enabled: !!username,
  });

export const useUserFollowingStateQuery = (userId?: string, enabled = true) =>
  useQuery({
    queryKey: userKeys.followingState(userId),
    queryFn: () => fetchIsFollowing(userId!),
    enabled: enabled && !!userId,
  });

export const useFollowingQuery = (userId?: string) =>
  useQuery({
    queryKey: userKeys.following(userId),
    queryFn: () => fetchFollowing(userId!),
    enabled: !!userId,
  });

export const useFollowersQuery = (userId?: string) =>
  useQuery({
    queryKey: userKeys.followers(userId),
    queryFn: () => fetchFollowers(userId!),
    enabled: !!userId,
  });

export const useUserCommentCountQuery = (userId?: string) =>
  useQuery({
    queryKey: userKeys.commentCount(userId),
    queryFn: () => fetchUserCommentCount(userId!),
    enabled: !!userId,
  });

export const useUserArticleCountQuery = (userId?: string) =>
  useQuery({
    queryKey: userKeys.articleCount(userId),
    queryFn: () => fetchUserArticleCount(userId!),
    enabled: !!userId,
  });

export const usePickupArticlesQuery = (userId?: string) =>
  useQuery({
    queryKey: userKeys.pickup(userId),
    queryFn: () => fetchPickupArticles(userId!),
    enabled: !!userId,
  });

export const useUserRankingQuery = () =>
  useQuery({ queryKey: userKeys.ranking(), queryFn: fetchUserRanking });
