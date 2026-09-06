import { useQuery } from "@tanstack/react-query";
import {
  fetchWebhook,
  fetchWebhookDeliveries,
  fetchWebhookMetadata,
  fetchWebhooks,
  type WebhookScope,
} from "../../api/webhooks";
import { webhookKeys } from "./keys";

export const useWebhookMetadataQuery = (scope: WebhookScope) =>
  useQuery({
    queryKey: webhookKeys.metadata(scope),
    queryFn: () => fetchWebhookMetadata(scope),
  });

export const useWebhooksQuery = (scope: WebhookScope) =>
  useQuery({
    queryKey: webhookKeys.list(scope),
    queryFn: () => fetchWebhooks(scope),
  });

export const useWebhookQuery = (scope: WebhookScope, id?: string) =>
  useQuery({
    queryKey: webhookKeys.detail(scope, id),
    queryFn: () => fetchWebhook(scope, id!),
    enabled: !!id,
  });

export const useWebhookDeliveriesQuery = (scope: WebhookScope, id?: string) =>
  useQuery({
    queryKey: webhookKeys.deliveries(scope, id),
    queryFn: () => fetchWebhookDeliveries(scope, id!),
    enabled: !!id,
  });
