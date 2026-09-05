import type {
  ApiError,
  HttpClient,
  HttpResponse,
  RequestConfig,
  ResponseType,
} from "./types";
import type { AuthFailureHandler } from "./AuthFailureHandler";
import type { AuthRefreshStrategy } from "./AuthRefreshStrategy";

type CreateHttpClientConfig = {
  baseURL: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  authFailureHandler?: AuthFailureHandler;
  authRefreshStrategy?: AuthRefreshStrategy;
  shouldRefreshAuth?: () => boolean;
  responseObserver?: (response: Response) => void;
};

export const MAINTENANCE_MODE_EVENT = "kuon:maintenance-mode-detected";

export class FetchHttpClient implements HttpClient {
  private baseURL: string;
  private baseHeaders?: Record<string, string>;
  private credentials?: RequestCredentials;
  private authFailureHandler?: AuthFailureHandler;
  private authRefreshStrategy?: AuthRefreshStrategy;
  private shouldRefreshAuth?: () => boolean;
  private responseObserver?: (response: Response) => void;

  private refreshPromise: Promise<void> | null = null;

  constructor(config: CreateHttpClientConfig) {
    this.baseURL = config.baseURL;
    this.baseHeaders = config.headers;
    this.credentials = config.credentials;
    this.authFailureHandler = config.authFailureHandler;
    this.authRefreshStrategy = config.authRefreshStrategy;
    this.shouldRefreshAuth = config.shouldRefreshAuth;
    this.responseObserver = config.responseObserver;
  }

  get<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>("GET", url, undefined, config);
  }

  post<T = any>(url: string, data?: unknown, config?: RequestConfig) {
    return this.request<T>("POST", url, data, config);
  }

  put<T = any>(url: string, data?: unknown, config?: RequestConfig) {
    return this.request<T>("PUT", url, data, config);
  }

  patch<T = any>(url: string, data?: unknown, config?: RequestConfig) {
    return this.request<T>("PATCH", url, data, config);
  }

  delete<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>("DELETE", url, undefined, config);
  }

  async refreshAuth(): Promise<void> {
    if (!this.authRefreshStrategy) return;

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const success = await this.authRefreshStrategy!.refresh();

      if (!success) {
        this.authFailureHandler?.handleAuthFailure();
        throw new Error("RefreshFailed");
      }
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async request<T = any>(
    method: string,
    url: string,
    body?: unknown,
    requestConfig?: RequestConfig,
    isRetry = false,
  ): Promise<HttpResponse<T>> {
    const isRefreshCall = url.includes("/refresh");
    const shouldAttemptPreRequestRefresh =
      !isRetry &&
      !isRefreshCall &&
      window.location.pathname !== "/login" &&
      this.shouldRefreshAuth?.();

    if (shouldAttemptPreRequestRefresh) {
      await this.refreshAuth();
    }

    const fullUrl = new URL(this.baseURL + url, window.location.origin);

    if (requestConfig?.params) {
      Object.entries(requestConfig.params).forEach(([key, value]) => {
        if (value !== undefined) {
          fullUrl.searchParams.append(key, String(value));
        }
      });
    }

    const serializedBody = serializeBody(body);
    const headers = this.buildHeaders(serializedBody, requestConfig?.headers);

    const res = await fetch(fullUrl.toString(), {
      method,
      credentials: this.credentials ?? "same-origin",
      headers,
      body: serializedBody,
    });

    this.responseObserver?.(res);

    if (!res.ok) {
      if (
        res.status === 401 &&
        !isRetry &&
        !isRefreshCall &&
        window.location.pathname !== "/login"
      ) {
        try {
          await this.refreshAuth();
          return this.request<T>(method, url, body, requestConfig, true);
        } catch {
          this.authFailureHandler?.handleAuthFailure();
        }
      }

      const errorData = await parseResponse<any>(res, requestConfig?.responseType);
      const normalizedError = normalizeApiError(res.status, errorData);

      if (
        res.status === 503 &&
        ["MAINTENANCE_MODE", "RUNTIME_MAINTENANCE"].includes(normalizedError.code) &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new Event(MAINTENANCE_MODE_EVENT));
      }

      throw normalizedError;
    }

    return {
      data: await parseResponse<T>(res, requestConfig?.responseType),
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
    };
  }

  private buildHeaders(
    body: BodyInit | undefined,
    requestHeaders?: Record<string, string>,
  ): HeadersInit {
    const headers: Record<string, string> = {
      ...this.baseHeaders,
      ...requestHeaders,
    };

    if (body instanceof FormData) {
      delete headers["Content-Type"];
    } else if (body !== undefined && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }
}

function normalizeApiError(status: number, data: any): ApiError {
  const standardError = data?.error;
  const code = standardError?.code ?? data?.code ?? getDefaultErrorCode(status);
  const message =
    standardError?.message ??
    data?.message ??
    (typeof data?.error === "string" ? data.error : undefined);
  const details = standardError?.details ?? data?.details;
  const responseData =
    standardError && typeof standardError === "object"
      ? { ...data, code, message, details }
      : data;

  return {
    status,
    code,
    message,
    details,
    response: {
      status,
      data: responseData,
    },
  };
}

function getDefaultErrorCode(status: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "AUTHENTICATION_REQUIRED";
    case 403:
      return "PERMISSION_DENIED";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED";
  }
}

async function parseResponse<T = any>(
  res: Response,
  responseType: ResponseType = "json",
): Promise<T> {
  switch (responseType) {
    case "text":
      return (await res.text()) as T;
    case "blob":
      return (await res.blob()) as T;
    case "json":
    default:
      try {
        return (await res.json()) as T;
      } catch {
        return null as T;
      }
  }
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof FormData) return body;
  if (body instanceof Blob) return body;
  return JSON.stringify(body);
}
