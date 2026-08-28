import { ServerSettingKey } from "../constants/serverSettings.js";
import {
  WebhookDeliveryRepository,
  type WebhookDeliveryTarget,
} from "../repositories/webhookDeliveryRepository.js";
import { serverSettingsService } from "./serverSettingsService.js";
import { eventLogger } from "./eventLogger.js";
import {
  WebhookEventType,
  WebhookScope,
  findWebhookEventDefinition,
} from "../webhooks/events.js";
import type {
  AnyWebhookContext,
  WebhookContext,
} from "../webhooks/context.js";
import { evaluateWebhookTemplate } from "../webhooks/templateEvaluator.js";

const REQUEST_TIMEOUT_MS = 10_000;

export type WebhookDispatchOptions = {
  recipientUserId?: string | null;
  selectedWebhookIds?: string[];
};

export class WebhookDispatcherService {
  constructor(private deliveryRepo: WebhookDeliveryRepository) {}

  async dispatch<TEvent extends WebhookEventType>(
    eventType: TEvent,
    context: WebhookContext<TEvent>,
    options: WebhookDispatchOptions = {},
  ): Promise<void> {
    if (!serverSettingsService.isEnabled(ServerSettingKey.WebhooksEnabled)) {
      return;
    }

    const definition = findWebhookEventDefinition(eventType);
    if (!definition) {
      throw new Error(`Unknown webhook event: ${eventType}`);
    }

    const allowUserWebhooks = serverSettingsService.isEnabled(
      ServerSettingKey.AllowUserWebhooks,
    );
    const recipientUserId = allowUserWebhooks
      ? (options.recipientUserId ?? undefined)
      : undefined;

    const targets = await this.deliveryRepo.findActiveTargets(
      eventType,
      recipientUserId,
    );
    const selected = options.selectedWebhookIds
      ? new Set(options.selectedWebhookIds)
      : null;

    await Promise.allSettled(
      targets
        .filter((target) => {
          if (selected && !selected.has(target.id)) return false;
          if (target.scope === WebhookScope.User && !allowUserWebhooks) return false;
          if (!definition.scopes.includes(target.scope)) return false;
          return true;
        })
        .map((target) => this.deliver(target, eventType, context)),
    );
  }

  async dispatchArticlePublished(
    context: WebhookContext<typeof WebhookEventType.ArticlePublished>,
    ownerUserId: string,
    selectedWebhookIds: string[],
  ): Promise<void> {
    return this.dispatch(WebhookEventType.ArticlePublished, context, {
      recipientUserId: ownerUserId,
      selectedWebhookIds,
    });
  }

  private async deliver(
    target: WebhookDeliveryTarget,
    eventType: WebhookEventType,
    context: AnyWebhookContext,
  ): Promise<void> {
    const startedAt = performance.now();

    try {
      const payload = evaluateWebhookTemplate(target.payloadTemplate, context);
      const headers = new Headers();

      for (const header of target.headers) {
        headers.set(header.name, header.value);
      }
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }

      const response = await fetch(target.url, {
        method: target.httpMethod,
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const durationMs = Math.round(performance.now() - startedAt);
      const errorMessage = response.ok
        ? undefined
        : `Webhook returned HTTP ${response.status}`;

      await this.deliveryRepo.recordDelivery({
        webhookId: target.id,
        eventType,
        success: response.ok,
        statusCode: response.status,
        durationMs,
        errorMessage,
      });

      if (!response.ok) {
        void eventLogger.error("webhook.failed", {
          source: "webhook",
          message: errorMessage ?? "Webhook delivery failed",
          subjectType: "webhook",
          subjectId: target.id,
          metadata: {
            eventType,
            statusCode: response.status,
            durationMs,
            scope: target.scope,
          },
        });
      }
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);
      const message =
        error instanceof Error ? error.message : "Webhook delivery failed";

      try {
        await this.deliveryRepo.recordDelivery({
          webhookId: target.id,
          eventType,
          success: false,
          durationMs,
          errorMessage: message,
        });
      } catch (logError) {
        console.error("Failed to record webhook delivery", logError);
      }

      void eventLogger.error("webhook.failed", {
        source: "webhook",
        message,
        subjectType: "webhook",
        subjectId: target.id,
        metadata: {
          eventType,
          durationMs,
          scope: target.scope,
        },
      });

      console.error(`Webhook delivery failed (${target.id})`, error);
    }
  }
}

export const webhookDispatcherService = new WebhookDispatcherService(
  new WebhookDeliveryRepository(),
);
