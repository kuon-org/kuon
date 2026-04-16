import authRefreshStrategy from "./CookieAuthRefreshStrategy";
import { FetchHttpClient } from "./FetchHttpClient";
import authFailureHandler from "./ReactQueryAuthFailureHandler";

/**
 * This Client is used for External Idp Auth Flow
 */
const authClient = new FetchHttpClient({
  baseURL: "/auth",
  credentials: "include",
  authFailureHandler: authFailureHandler,
  authRefreshStrategy: authRefreshStrategy,
});

export default authClient;
