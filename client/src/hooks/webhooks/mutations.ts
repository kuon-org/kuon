import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteWebhook,
  previewWebhookPayload,
  saveWebhook,
  setWebhookActive,
  testWebhook,
  type PreviewInput,
  type UserWebhookInput,
  type WebhookInput,
  type WebhookScope,
  type WebhookTestInput,
} from "../../api/webhooks";
import { webhookKeys } from "./keys";

export const useSaveWebhook = (scope: WebhookScope) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id?: string;
      input: WebhookInput | UserWebhookInput;
    }) => saveWebhook(scope, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: webhookKeys.list(scope),
      });
    },
  });
};

export const useDeleteWebhook = (scope: WebhookScope) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWebhook(scope, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: webhookKeys.list(scope),
      });
    },
  });
};

export const useSetWebhookActive = (scope: WebhookScope) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      setWebhookActive(scope, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: webhookKeys.list(scope),
      });
    },
  });
};

export const usePreviewWebhookPayload = (scope: WebhookScope) =>
  useMutation({
    mutationFn: (input: PreviewInput | unknown) =>
      previewWebhookPayload(scope, input),
  });

export const useTestWebhook = (scope: WebhookScope) =>
  useMutation({
    mutationFn: (input: WebhookTestInput) => testWebhook(scope, input),
  });
