import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStockList,
  deleteStockList,
  likeStockList,
  StockListPayload,
  toggleArticleStock,
  toggleDefaultStock,
  updateStockList,
} from "../../api/stocks";
import { useNotify } from "../useNotify";
import { stockKeys } from "./keys";

export const useToggleArticleStock = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success } = useNotify();

  return useMutation({
    mutationFn: (listId: string) => toggleArticleStock(listId, articleId),
    onSuccess: (data) => {
      success(data.message);
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.details() });
    },
  });
};

export const useCreateStockList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockListPayload) => createStockList(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

export const useUpdateStockList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, payload }: { listId: string; payload: StockListPayload }) =>
      updateStockList(listId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.details() });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

export const useDeleteStockList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStockList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.details() });
    },
  });
};

export const useToggleDefaultStock = (articleId: string) => {
  const queryClient = useQueryClient();
  const { success } = useNotify();

  return useMutation({
    mutationFn: () => toggleDefaultStock(articleId),
    onSuccess: (data) => {
      success(data.message);
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockKeys.details() });
    },
  });
};

export const useLikeStockList = (listId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!listId) throw new Error("ストックIDが指定されていません");
      return likeStockList(listId);
    },
    onSuccess: () => {
      if (listId) {
        queryClient.invalidateQueries({ queryKey: stockKeys.like(listId) });
      }
      queryClient.invalidateQueries({ queryKey: stockKeys.details() });
    },
  });
};
