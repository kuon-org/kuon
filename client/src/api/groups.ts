import apiClient from "./client";
import type { ArticleSummary } from "./articles";

export type GroupRole = "owner" | "admin" | "member";

export interface GroupSummary {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  description?: string | null;
  _count: { user_groups: number; articles: number };
}

export interface MyGroupMembership {
  role: GroupRole;
  joined_at: string;
  groups: GroupSummary;
}

export interface GroupDetail extends GroupSummary {
  current_user_role: GroupRole | null;
  user_groups: Array<{
    role: GroupRole;
    joined_at: string;
    users: { id: string; username: string; display_name: string; avatar_url: string };
  }>;
  articles: ArticleSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface GroupFeed {
  articles: ArticleSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export const fetchGroups = async () => (await apiClient.get<GroupSummary[]>("/groups")).data;
export const fetchMyGroups = async () => (await apiClient.get<MyGroupMembership[]>("/groups/me")).data;
export const fetchGroupFeed = async (page = 1) => (await apiClient.get<GroupFeed>("/groups/feed", { params: { page, limit: 10 } })).data;
export const fetchGroupFollowing = async (slug: string) => (await apiClient.get<{ isFollowing: boolean }>(`/groups/${slug}/is-following`)).data;
export const toggleGroupFollowing = async (slug: string) => (await apiClient.post<{ isFollowing: boolean }>(`/groups/${slug}/follow`)).data;
export const fetchGroup = async (slug: string, page = 1) =>
  (await apiClient.get<GroupDetail>(`/groups/${slug}`, { params: { page, limit: 10 } })).data;
export const createGroup = async (data: { name: string; slug: string; display_name: string; description?: string }) =>
  (await apiClient.post<GroupSummary>("/groups", data)).data;
export const updateGroup = async (slug: string, data: { name?: string; display_name?: string; description?: string }) =>
  (await apiClient.patch<GroupSummary>(`/groups/${slug}`, data)).data;
export const deleteGroup = async (slug: string) => apiClient.delete(`/groups/${slug}`);
export const addGroupMember = async (slug: string, username: string, role: GroupRole) =>
  apiClient.post(`/groups/${slug}/members`, { username, role });
export const updateGroupMember = async (slug: string, userId: string, role: GroupRole) =>
  apiClient.patch(`/groups/${slug}/members/${userId}`, { role });
export const removeGroupMember = async (slug: string, userId: string) =>
  apiClient.delete(`/groups/${slug}/members/${userId}`);
