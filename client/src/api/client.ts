import authRefreshStrategy from "./CookieAuthRefreshStrategy";
import { FetchHttpClient } from "./FetchHttpClient";
import authFailureHandler from "./ReactQueryAuthFailureHandler";
import authSessionManager from "./AuthSessionManager";

/**
 * This Client used for Common Http Request.
 * Like Axios.
 */
const apiClient = new FetchHttpClient({
  baseURL: "/api",
  credentials: "include",
  authFailureHandler: authFailureHandler,
  authRefreshStrategy: authRefreshStrategy,
  responseObserver: (response) => authSessionManager.syncFromResponse(response),
});

export default apiClient;
