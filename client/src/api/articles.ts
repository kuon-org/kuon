import apiClient from "./client";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  avatar_url: string;
}

export interface ArticleTag {
  tags: Tag;
}

export interface ArticleGroup {
  id: string;
  slug: string;
  display_name: string;
}

export interface ArticleSummary {
  id: string;
  user_id: string;
  group_id?: string | null;
  title: string;
  summary: string;
  created_at: string;
  like_count: number;
  article_tags: ArticleTag[];
  users: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  groups?: ArticleGroup | null;
}

export interface Article {
  id: string;
  title: string;
  raw_content: string;
  render_content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  summary: string;
  is_published: boolean;
  is_private: boolean;
  visibility: "public" | "unlisted" | "private" | "members";
  group_id?: string | null;
  users: {
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
  };
  groups?: ArticleGroup | null;
  article_tags: ArticleTag[];
}

export interface UserArticle {
  id: string;
  user_id: string;
  title: string;
  raw_content: string;
  render_content: string;
  summary: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_published: boolean;
  is_private: boolean;
  visibility: "public" | "unlisted" | "private" | "members";
  group_id?: string | null;
  groups?: ArticleGroup | null;
  like_count: number;
  article_tags: ArticleTag[];
}

export interface LikeUser {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
}

export interface LikeUserResponse {
  like_users: LikeUser[];
  like_count: number;
}

export interface IsLikedResponse {
  isLike: boolean;
}

export interface IsOwnedResponse {
  isOwned: boolean;
}

export interface CreateArticleData {
  title: string;
  raw_content: string;
  summary: string;
  status: "draft" | "public";
  is_published: boolean;
  is_private: boolean;
  visibility: "public" | "unlisted" | "private" | "members";
  group_id?: string | null;
  tagIds: string[];
  notify_webhooks?: boolean;
  webhook_ids?: string[];
}

export interface EditArticleData extends CreateArticleData {}

export interface PaginatedArticles {
  articles: ArticleSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export const createArticle = async (payload: CreateArticleData) => {
  const { data } = await apiClient.post<{ id: string }>("/articles/create", payload);
  return data;
};

export const editArticle = async (articleId: string, payload: EditArticleData) => {
  const { data } = await apiClient.patch(`/articles/${articleId}/edit`, payload);
  return data;
};

export const fetchArticle = async (articleId: string) => {
  const { data } = await apiClient.get<Article>(`/articles/${articleId}`);
  return data;
};

export const fetchArticles = async (page: number) => {
  const { data } = await apiClient.get<PaginatedArticles>("/articles", { params: { page, limit: 10 } });
  return data;
};

export const fetchRecommendedArticles = async (page: number) => {
  const { data } = await apiClient.get<PaginatedArticles>("/articles/recommends", { params: { page, limit: 10 } });
  return data;
};

export const fetchTrendArticles = async (page: number) => {
  const { data } = await apiClient.get<PaginatedArticles>("/articles/trends", { params: { page, limit: 10 } });
  return data;
};

export const fetchArticleOwnership = async (articleId: string) => {
  const { data } = await apiClient.get<IsOwnedResponse>(`/articles/${articleId}/isowned`);
  return data;
};

export const fetchArticleLikeUsers = async (articleId: string) => {
  const { data } = await apiClient.get<LikeUserResponse>(`/articles/${articleId}/likes`);
  return data;
};

export const fetchArticleIsLiked = async (articleId: string) => {
  const { data } = await apiClient.get<IsLikedResponse>(`/articles/${articleId}/islike`);
  return data;
};

export const toggleArticleLike = async (articleId: string) => {
  const { data } = await apiClient.post<{ isLike: boolean; message: string }>(`/articles/${articleId}/like`);
  return data;
};

export const fetchUserArticles = async () => {
  const { data } = await apiClient.get<UserArticle[]>("/articles/me");
  return data;
};

export const uploadArticleImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await apiClient.post<{ url: string }>("/articles/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const rollbackArticle = async (articleId: string) => {
  const { data } = await apiClient.post(`/articles/${articleId}/rollback`);
  return data;
};

export const deleteArticle = async (articleId: string) => {
  const { data } = await apiClient.delete(`/articles/${articleId}`);
  return data;
};

export const fetchTrashArticles = async () => {
  const { data } = await apiClient.get<UserArticle[]>("/articles/trash/list");
  return data;
};

export const restoreArticle = async (articleId: string) => {
  const { data } = await apiClient.post(`/articles/${articleId}/restore`);
  return data;
};

export const hardDeleteArticle = async (articleId: string) => {
  const { data } = await apiClient.delete(`/articles/${articleId}/hard`);
  return data;
};

export const fetchMarp = async (articleId: string) => {
  const { data } = await apiClient.get(`/articles/marp/${articleId}`);
  return data;
};
