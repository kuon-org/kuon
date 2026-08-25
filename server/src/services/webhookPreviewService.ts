import { evaluateWebhookTemplate } from "../webhooks/templateEvaluator.js";
import { articlePublishedSampleContext } from "../webhooks/samples.js";

const TEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BODY_LENGTH = 2_000;

export type WebhookPreviewInput = {
  payloadTemplate: unknown;
};

export type WebhookTestSendInput = WebhookPreviewInput & {
  url: string;
  headers?: Array<{
    name: string;
    value: string;
  }>;
};

export class WebhookPreviewService {
  preview(input: WebhookPreviewInput) {
    return evaluateWebhookTemplate(
      input.payloadTemplate,
      articlePublishedSampleContext,
    );
  }

  async testSend(input: WebhookTestSendInput) {
    const url = new URL(input.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Webhook URLはhttpまたはhttpsを指定してください");
    }

    const headers = new Headers();
    for (const header of input.headers ?? []) {
      if (header.name.trim()) {
        headers.set(header.name.trim(), header.value);
      }
    }
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const payload = this.preview(input);
    const startedAt = performance.now();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });
    const durationMs = Math.round(performance.now() - startedAt);

    const responseBody = (await response.text()).slice(
      0,
      MAX_RESPONSE_BODY_LENGTH,
    );

    return {
      ok: response.ok,
      status: response.status,
      durationMs,
      responseBody,
      payload,
    };
  }
}

export const webhookPreviewService = new WebhookPreviewService();
