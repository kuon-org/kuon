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
};

export class FetchHttpClient implements HttpClient {
  private baseURL: string;
  private baseHeaders?: Record<string, string>;
  private credentials?: RequestCredentials;
  private authFailureHandler?: AuthFailureHandler;
  private authRefreshStrategy?: AuthRefreshStrategy;

  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: CreateHttpClientConfig) {
    this.baseURL = config.baseURL;
    this.baseHeaders = config.headers;
    this.credentials = config.credentials;
    this.authFailureHandler = config.authFailureHandler;
    this.authRefreshStrategy = config.authRefreshStrategy;
  }

  // ===== public API =====

  get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>("GET", url, undefined, config);
  }

  post<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>("POST", url, data, config);
  }

  put<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>("PUT", url, data, config);
  }

  patch<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>("PATCH", url, data, config);
  }

  delete<T = any>(
    url: string,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    return this.request<T>("DELETE", url, undefined, config);
  }

  // ===== internal =====

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

    if (!res.ok) {
      if (
        res.status === 401 &&
        !isRetry &&
        window.location.pathname !== "/login"
      ) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          this.refreshPromise = (
            this.authRefreshStrategy?.refresh() ?? Promise.resolve(false)
          ).finally(() => {
            this.isRefreshing = false;
            this.refreshPromise = null;
          });
        }

        const refreshSuccess = await this.refreshPromise;

        if (refreshSuccess) {
          return this.request<T>(method, url, body, requestConfig, true);
        } else {
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
