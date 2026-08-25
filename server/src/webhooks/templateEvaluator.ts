import type { AnyWebhookContext } from "./context.js";

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const EXACT_VARIABLE_PATTERN = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;

const resolvePath = (context: AnyWebhookContext, path: string): unknown => {
  let current: unknown = context;

  for (const segment of path.split(".")) {
    if (
      current === null ||
      typeof current !== "object" ||
      !(segment in current)
    ) {
      throw new Error(`未定義のWebhook変数です: ${path}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
};

const evaluateValue = (value: unknown, context: AnyWebhookContext): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => evaluateValue(item, context));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        evaluateValue(child, context),
      ]),
    );
  }

  if (typeof value !== "string") {
    return value;
  }

  const exactMatch = value.match(EXACT_VARIABLE_PATTERN);
  if (exactMatch) {
    return resolvePath(context, exactMatch[1]);
  }

  return value.replace(VARIABLE_PATTERN, (_match, path: string) => {
    const resolved = resolvePath(context, path);
    return resolved === null || resolved === undefined ? "" : String(resolved);
  });
};

export const evaluateWebhookTemplate = (
  template: unknown,
  context: AnyWebhookContext,
): unknown => evaluateValue(template, context);
