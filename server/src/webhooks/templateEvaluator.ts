import type { AnyWebhookContext } from "./context.js";

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const EXACT_VARIABLE_PATTERN = /^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/;
const OMIT = Symbol("webhook-template-omit");

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

const evaluateValue = (
  value: unknown,
  context: AnyWebhookContext,
): unknown | typeof OMIT => {
  if (Array.isArray(value)) {
    return value
      .map((item) => evaluateValue(item, context))
      .filter((item) => item !== OMIT);
  }

  if (value !== null && typeof value === "object") {
    const entries: Array<[string, unknown]> = [];
    for (const [key, child] of Object.entries(value)) {
      const evaluated = evaluateValue(child, context);
      if (evaluated !== OMIT) {
        entries.push([key, evaluated]);
      }
    }
    return Object.fromEntries(entries);
  }

  if (typeof value !== "string") {
    return value;
  }

  const exactMatch = value.match(EXACT_VARIABLE_PATTERN);
  if (exactMatch) {
    const resolved = resolvePath(context, exactMatch[1]);
    return resolved === null || resolved === undefined ? OMIT : resolved;
  }

  return value.replace(VARIABLE_PATTERN, (_match, path: string) => {
    const resolved = resolvePath(context, path);
    return resolved === null || resolved === undefined ? "" : String(resolved);
  });
};

export const evaluateWebhookTemplate = (
  template: unknown,
  context: AnyWebhookContext,
): unknown => {
  const evaluated = evaluateValue(template, context);
  return evaluated === OMIT ? null : evaluated;
};
