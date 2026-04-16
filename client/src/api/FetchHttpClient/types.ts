export type ResponseType = "json" | "text" | "blob";

export type HttpResponse<T = any> = {
  data: T;
  status: number;
  headers: Record<string, string>;
};

export type HttpError<T = any> = {
  response?: {
    status: number;
    data: T;
  };
};

export type RequestConfig = {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  responseType?: ResponseType;
};

export type HttpClient = {
  get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
  post<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
  put<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
  patch<T = any>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
  delete<T = any>(
    url: string,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
};
