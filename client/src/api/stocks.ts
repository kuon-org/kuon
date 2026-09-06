import apiClient from "./client";

export interface StockList {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "limited" | "private";
  created_at: string;
  updated_at: string;
  is_system: boolean;
  is_default: boolean;
  isStored?: boolean;
  users: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    bio?: string;
  };
  stock_list_tags: {
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  _count?: {
    stock_items: number;
    stock_list_likes: number;
  };
  totalCount?: number;
}

export interface StockListDetail extends StockList {
  stock_items: {
    id: string;
    created_at: string;
    articles: {
      id: string;
      title: string;
      created_at: string;
      like_count: number;
      users: {
        username: string;
        display_name: string;
        avatar_url: string;
      };
      article_tags: {
        tags: {
          id: string;
          name: string;
          slug: string;
        };
      }[];
    };
  }[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface StockListPayload {
  name: string;
  description?: string;
  visibility?: "public" | "limited" | "private";
  tagIds?: string[];
  is_default?: boolean;
}

export const fetchMyStockLists = async (articleId?: string) => {
  const params = articleId ? { articleId } : {};
  const { data } = await apiClient.get("/stocks/mylists", { params });
  return data as StockList[];
};

export const fetchPublicStockLists = async (page: number) => {
  const { data } = await apiClient.get("/stocks/lists", {
    params: { page, limit: 10 },
  });
  return data;
};

export const fetchStockListDetail = async (
  listId: string | undefined,
  page: number,
  q?: string,
) => {
  const endpoint = listId ? `/stocks/lists/${listId}` : "/stocks/alllists";
  const { data } = await apiClient.get(endpoint, {
    params: { page, limit: 10, q },
  });
  return data as StockListDetail;
};

export const toggleArticleStock = async (listId: string, articleId: string) => {
  const { data } = await apiClient.post(`/stocks/lists/${listId}/articles`, {
    articleId,
  });
  return { listId, ...data };
};

export const createStockList = async (payload: StockListPayload) => {
  const { data } = await apiClient.post("/stocks/lists", payload);
  return data;
};

export const updateStockList = async (
  listId: string,
  payload: StockListPayload,
) => {
  const { data } = await apiClient.patch(`/stocks/lists/${listId}`, payload);
  return data;
};

export const deleteStockList = async (listId: string) => {
  const { data } = await apiClient.delete(`/stocks/lists/${listId}`);
  return data;
};

export const toggleDefaultStock = async (articleId: string) => {
  const { data } = await apiClient.post("/stocks/default/articles", { articleId });
  return data;
};

export const fetchStockListLike = async (listId: string) => {
  const { data } = await apiClient.get(`/stocks/lists/${listId}/islike`);
  return data.isLiked as boolean;
};

export const likeStockList = async (listId: string) => {
  const { data } = await apiClient.post(`/stocks/lists/${listId}/like`);
  return data;
};
