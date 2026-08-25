import { ServerSettingKey } from "../constants/serverSettings.js";
import {
  WebhookDeliveryRepository,
  type WebhookDeliveryTarget,
} from "../repositories/webhookDeliveryRepository.js";
import { serverSettingsService } from "./serverSettingsService.js";
import {
  WebhookEventType,
  WebhookScope,
} from "../webhooks/events.js";
import type { WebhookContext } from "../webhooks/context.js";
import { evaluateWebhookTemplate } from "../webhooks/templateEvaluator.js";

const REQUEST_TIMEOUT_MS = 10_000;

export class WebhookDispatcherService {
  constructor(private deliveryRepo: WebhookDeliveryRepository) {}

  async dispatchArticlePublished(
    context: WebhookContext<typeof WebhookEventType.ArticlePublished>,
    ownerUserId: string,
    selectedWebhookIds: string[],
  ): Promise<void> {
    if (
      selectedWebhookIds.length === 0 ||
      !serverSettingsService.isEnabled(ServerSettingKey.WebhooksEnabled)
    ) {
      return;
    }

    const allowUserWebhooks = serverSettingsService.isEnabled(
      ServerSettingKey.AllowUserWebhooks,
    );

    const selected = new Set(selectedWebhookIds);
    const targets = await this.deliveryRepo.findActiveTargets(
      WebhookEventType.ArticlePublished,
      allowUserWebhooks ? ownerUserId : undefined,
    );

    await Promise.allSettled(
      targets
        .filter(
          (target) =>
            selected.has(target.id) &&
            (target.scope === WebhookScope.System || allowUserWebhooks),
        )
        .map((target) =>
          this.deliver(target, WebhookEventType.ArticlePublished, context),
        ),
    );
  }

  private async deliver(
    target: WebhookDeliveryTarget,
    eventType: typeof WebhookEventType.ArticlePublished,
    context: WebhookContext<typeof WebhookEventType.ArticlePublished>,
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
      await this.deliveryRepo.recordDelivery({
        webhookId: target.id,
        eventType,
        success: response.ok,
        statusCode: response.status,
        durationMs,
        errorMessage: response.ok
          ? undefined
          : `Webhook returned HTTP ${response.status}`,
      });
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

      console.error(`Webhook delivery failed (${target.id})`, error);
    }
  }
}

export const webhookDispatcherService = new WebhookDispatcherService(
  new WebhookDeliveryRepository(),
);
