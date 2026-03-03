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
  description?: string;
}

export const useTagsQuery = (slug?: string) => {
  const queryClient = useQueryClient();
  const { error } = useNotify();
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
    },
    onError: (err: any) => {
      console.error(err);
      error(err.response?.data?.message ?? "タグの保存に失敗しました");
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
  };
};
