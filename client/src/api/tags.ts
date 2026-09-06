import apiClient from "./client";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url: string;
  articleCount: number;
  followCount: number;
}

export interface TagListItem {
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

export interface FollowingTag {
  id: string;
  name: string;
  slug: string;
  avatar_url: string;
  description: string;
  created_at: string;
}

export interface UserFollowingTags {
  tags: FollowingTag[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface TagFollowState {
  isFollow: boolean;
}

export const fetchTags = async () => {
  const { data } = await apiClient.get<TagListItem[]>("/tags");
  return data;
};

export const fetchTag = async (slug: string) => {
  const { data } = await apiClient.get<Tag>(`/tags/${slug}`);
  return data;
};

export const upsertTag = async (input: UpsertTagData) => {
  const { data } = await apiClient.post("/tags", input);
  return data as Tag;
};

export const fetchFollowingTags = async (userId: string, page = 1, limit = 20) => {
  const { data } = await apiClient.get<UserFollowingTags>(`/users/${userId}/following_tags`, {
    params: { page, limit },
  });
  return data;
};

export const fetchMyFollowingTags = async () => {
  const { data } = await apiClient.get<FollowingTag[]>("/users/tags/me");
  return data;
};

export const fetchTagFollowState = async (slug: string) => {
  const { data } = await apiClient.get<TagFollowState>(`/tags/${slug}/isFollowing`);
  return data;
};

export const toggleTagFollow = async (slug: string) => {
  const { data } = await apiClient.post<TagFollowState>(`/tags/${slug}/follow`);
  return data;
};

export const uploadTagAvatar = async (slug: string, file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await apiClient.post(`/tags/${slug}/upload_avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as { url: string };
};
