import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useNotify } from "./useNotify";

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
  articleCount: number;
  followCount: number;
}

export interface UpsertTagData {
  name: string;
  slug: string;
  avatar_url?: string | null;
  description?: string;
}

export interface MyFollwingTags {
  id: string;
  name: string;
  slug: string;
  avatar_url: string;
  description: string;
  created_at: string;
}

export const useTagsQuery = (slug?: string, userId?: string, page?: number) => {
  const queryClient = useQueryClient();
  const { notify, error } = useNotify();
  // 🏷 タグ一覧取得
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
  });

  // ➕ タグの作成・更新 (Upsert)
  const upsertTagMutation = useMutation({
    mutationFn: async (newTag: UpsertTagData) => {
      const res = await apiClient.post("/tags", newTag);
      return res.data;
    },
    onSuccess: () => {
      // タグ一覧のキャッシュを更新
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tag", slug] });
    },
    onError: (err: any) => {
      console.error(err);
      error(err.response?.data?.message ?? "タグの保存に失敗しました");
    },
  });

  const getFollowingTags = useQuery({
    queryKey: ["followingTags", userId, page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/users/${userId}/following_tags`, {
        params: { page, limit: 20 },
      });
      return data;
    },
    enabled: !!userId,
  });

  const getMyFollowingTags = useQuery<MyFollwingTags[]>({
    queryKey: ["myFollowingTags"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users/tags/me");
      console.log("useTags", data);
      return data;
    },
    enabled: !!queryClient.getQueryData(["authUser"]),
  });

  const getIsFollowing = useQuery({
    queryKey: ["isFollowingTag", slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tags/${slug}/isFollowing`);
      return data;
    },
    enabled: !!queryClient.getQueryData(["authUser"]),
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
      notify(data.isFollowing ? "フォローしました" : "フォロー解除しました");
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
    onError: (err: any) => {
      error(err.response?.data.message ?? "画像アップロードに失敗しました");
    },
  });

  return {
    tags: tagsQuery.data ?? [],
    tags_isLoading: tagsQuery.isLoading,
    tags_isError: tagsQuery.isError,
    tag: getTagQuery.data,
    tag_isLoading: getTagQuery.isLoading,
    tag_isError: getTagQuery.isError,
    upsertTag: upsertTagMutation.mutateAsync, // 非同期で待機できるようにAsync版を公開
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
