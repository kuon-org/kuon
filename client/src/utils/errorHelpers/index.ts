import type { ApiError } from "../../api/FetchHttpClient";
import i18n from "../../i18n";

export const isApiError = (error: unknown): error is ApiError => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as Partial<ApiError>;
  return (
    typeof candidate.status === "number" && typeof candidate.code === "string"
  );
};

export const getErrorStatus = (error: unknown): number | undefined =>
  isApiError(error) ? error.status : undefined;

export const getErrorCode = (error: unknown): string | undefined =>
  isApiError(error) ? error.code : undefined;

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
  messagesByCode: Record<string, string> = {},
): string => {
  const code = getErrorCode(error);
  if (!code) return fallback;
  if (messagesByCode[code]) return messagesByCode[code];

  return i18n.t(code, {
    ns: "errors",
    defaultValue: fallback,
  });
};

export const isForbidden = (error: unknown) => getErrorStatus(error) === 403;
export const isUnauthorized = (error: unknown) => getErrorStatus(error) === 401;
export const isNotFound = (error: unknown) => getErrorStatus(error) === 404;
export const isServerError = (error: unknown) => {
  const status = getErrorStatus(error);
  return status !== undefined && status >= 500;
};
