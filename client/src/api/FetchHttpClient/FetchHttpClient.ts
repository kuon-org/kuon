import type {
  HttpClient,
  HttpError,
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
  responseObserver?: (response: Response) => void;
};

export class FetchHttpClient implements HttpClient {
  private baseURL: string;
  private baseHeaders?: Record<string, string>;
  private credentials?: RequestCredentials;
  private authFailureHandler?: AuthFailureHandler;
  private authRefreshStrategy?: AuthRefreshStrategy;
  private responseObserver?: (response: Response) => void;

  private refreshPromise: Promise<void> | null = null;

  constructor(config: CreateHttpClientConfig) {
    this.baseURL = config.baseURL;
    this.baseHeaders = config.headers;
    this.credentials = config.credentials;
    this.authFailureHandler = config.authFailureHandler;
    this.authRefreshStrategy = config.authRefreshStrategy;
    this.responseObserver = config.responseObserver;
  }

  // ===== public API =====

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

  // ===== refresh control =====

  async refreshAuth(): Promise<void> {
    if (!this.authRefreshStrategy) return;

    // 既に refresh 中なら待つ
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // 新規 refresh
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

  // ===== request =====

  private async request<T = any>(
    method: string,
    url: string,
    body?: unknown,
    requestConfig?: RequestConfig,
    isRetry = false,
  ): Promise<HttpResponse<T>> {
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

    // ===== 401 handling =====
    if (!res.ok) {
      const isRefreshCall = url.includes("/refresh");

      if (
        res.status === 401 &&
        !isRetry &&
        !isRefreshCall &&
        window.location.pathname !== "/login"
      ) {
        try {
          await this.refreshAuth();

          // refresh 成功 → retry
          return this.request<T>(method, url, body, requestConfig, true);
        } catch {
          // refresh 失敗
          this.authFailureHandler?.handleAuthFailure();
        }
      }

      const error: HttpError = {
        response: {
          status: res.status,
          data: await parseResponse<any>(res, requestConfig?.responseType),
        },
      };

      throw error;
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

// ===== helpers =====

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
