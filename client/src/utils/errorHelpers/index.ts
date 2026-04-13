import type { HttpError } from "../../api/types";

/**
 * HttpErrorかどうかを判定する
 */
export const isHttpError = (error: any): error is HttpError => {
  return error && typeof error === "object" && "response" in error;
};

/**
 * エラーオブジェクトからステータスコードを取得する
 */
export const getErrorStatus = (error: any): number | undefined => {
  if (isHttpError(error)) {
    return error.response?.status;
  }
  // その他の形式（標準のエラーオブジェクトにstatusが含まれる場合など）
  if (error?.status) return error.status;
  return undefined;
};

export const isForbidden = (error: any) => getErrorStatus(error) === 403;
export const isUnauthorized = (error: any) => getErrorStatus(error) === 401;
export const isNotFound = (error: any) => getErrorStatus(error) === 404;
export const isServerError = (error: any) => {
  const status = getErrorStatus(error);
  return status ? status >= 500 : false;
};
