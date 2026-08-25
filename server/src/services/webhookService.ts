import { findWebhookEventDefinition, WebhookScope } from "../webhooks/events.js";
import type { CreateWebhookInput } from "../webhooks/types.js";

const validateUrl = (value: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Webhook URLが不正です");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Webhook URLはhttpまたはhttpsを指定してください");
  }
};

export class WebhookService {
  validateCreateInput(input: CreateWebhookInput): void {
    if (!input.name.trim()) {
      throw new Error("Webhook名を指定してください");
    }

    validateUrl(input.url);

    if (input.scope === WebhookScope.System && input.ownerUserId) {
      throw new Error("system scopeにowner userは指定できません");
    }

    if (input.scope === WebhookScope.User && !input.ownerUserId) {
      throw new Error("user scopeにはowner userが必要です");
    }

    if (input.events.length === 0) {
      throw new Error("購読するWebhook eventを1つ以上指定してください");
    }

    for (const eventType of input.events) {
      const definition = findWebhookEventDefinition(eventType);
      if (!definition) {
        throw new Error(`未対応のWebhook eventです: ${eventType}`);
      }

      if (!definition.scopes.includes(input.scope)) {
        throw new Error(
          `${eventType} は ${input.scope} scopeでは利用できません`,
        );
      }
    }

    const headerNames = new Set<string>();
    for (const header of input.headers ?? []) {
      const normalizedName = header.name.trim().toLowerCase();
      if (!normalizedName) {
        throw new Error("Header名を指定してください");
      }
      if (headerNames.has(normalizedName)) {
        throw new Error(`Headerが重複しています: ${header.name}`);
      }
      headerNames.add(normalizedName);
    }
  }
}

export const webhookService = new WebhookService();
