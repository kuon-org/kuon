const ABSOLUTE_HTTP_URL = /^https?:\/\//i;

export const toWebhookExternalUrl = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  if (ABSOLUTE_HTTP_URL.test(value)) return value;

  const baseUrl = process.env.APP_SITE_URL?.replace(/\/$/, "");
  if (!baseUrl) return value;

  return `${baseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
};

export const buildWebhookArticleUrl = (articleId: string): string =>
  toWebhookExternalUrl(`/share/${articleId}`) ?? `/share/${articleId}`;
