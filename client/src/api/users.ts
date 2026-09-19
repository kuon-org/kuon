import apiClient from "./client";

export interface User {
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
  created_by: unknown;
}

export interface RankingUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  contribution: number;
}

export interface FollowState {
  isFollow: boolean;
}

export interface RelatedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
}

export const fetchUser = async (username: string) => {
  const { data } = await apiClient.get<User>(`/users/${username}`);
  return data;
};

export const fetchIsFollowing = async (userId: string) => {
  const { data } = await apiClient.get<FollowState>(
    `/users/${userId}/isfollowing`,
  );
  return data;
};

export const fetchFollowing = async (userId: string) => {
  const { data } = await apiClient.get<RelatedUser[]>(
    `/users/${userId}/follow`,
  );
  return data;
};

export const fetchFollowers = async (userId: string) => {
  const { data } = await apiClient.get<RelatedUser[]>(
    `/users/${userId}/follower`,
  );
  return data;
};

export const fetchUserCommentCount = async (userId: string) => {
  const { data } = await apiClient.get<{ commentCount: number }>(
    `/users/${userId}/comments`,
  );
  return data.commentCount;
};

export const fetchUserArticleCount = async (userId: string) => {
  const { data } = await apiClient.get<{ articleCount: number }>(
    `/users/${userId}/articles`,
  );
  return data.articleCount;
};

export const followUser = async (followeeId: string) => {
  const { data } = await apiClient.post<FollowState>("/users/follow", {
    followeeId,
  });
  return data;
};

export const fetchPickupArticles = async (userId: string) => {
  const { data } = await apiClient.get(`/users/${userId}/pickup`);
  return data;
};

export const createPickupArticle = async (articleId: string) => {
  const { data } = await apiClient.post("/users/pickup/create", { articleId });
  return data;
};

export const deletePickupArticle = async (articleId: string) => {
  const { data } = await apiClient.post("/users/pickup/delete", { articleId });
  return data;
};

export const fetchUserRanking = async () => {
  const { data } = await apiClient.get<RankingUser[]>("/users/ranking/all");
  return data;
};
