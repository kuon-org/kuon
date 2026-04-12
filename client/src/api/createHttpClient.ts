import { queryClient } from "../utils/queryClient";
import type {
  HttpClient,
  HttpError,
  HttpResponse,
  RequestConfig,
  ResponseType,
} from "./types";

type CreateHttpClientConfig = {
  baseURL: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

export function createHttpClient(config: CreateHttpClientConfig): HttpClient {
  async function request<T>(
    method: string,
    url: string,
    body?: unknown,
    requestConfig?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const fullUrl = new URL(config.baseURL + url, window.location.origin);

    // params（undefined は無視）
    if (requestConfig?.params) {
      Object.entries(requestConfig.params).forEach(([key, value]) => {
        if (value !== undefined) {
          fullUrl.searchParams.append(key, String(value));
        }
      });
    }

    const res = await fetch(fullUrl.toString(), {
      method,
      credentials: config.credentials ?? "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
        ...requestConfig?.headers,
      },
      body: serializeBody(body),
    });

    if (!res.ok) {
      // ===== axios interceptors.response 相当 =====
      if (res.status === 401 && window.location.pathname !== "/login") {
        queryClient.setQueryData(["authUser"], null);
      }

      const error: HttpError = {
        response: {
          status: res.status,
          data: await parseResponse(res, requestConfig?.responseType),
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

  return {
    get<T>(url: string, config?: RequestConfig) {
      return request<T>("GET", url, undefined, config);
    },

    post<T>(url: string, data?: unknown, config?: RequestConfig) {
      return request<T>("POST", url, data, config);
    },

    put<T>(url: string, data?: unknown, config?: RequestConfig) {
      return request<T>("PUT", url, data, config);
    },

    patch<T>(url: string, data?: unknown, config?: RequestConfig) {
      return request<T>("PATCH", url, data, config);
    },

    delete<T>(url: string, config?: RequestConfig) {
      return request<T>("DELETE", url, undefined, config);
    },
  };
}

// ===== axios responseType 互換の最小実装 =====
async function parseResponse<T>(
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

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof Blob) {
    return body;
  }

  return JSON.stringify(body);
}
