import authSessionManager from "./AuthSessionManager";

type RefreshAuth = () => Promise<void>;

export const startAuthSessionLifecycle = (refreshAuth: RefreshAuth) => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState !== "visible") return;
    if (window.location.pathname === "/login") return;
    if (!authSessionManager.shouldRefreshAccessToken()) return;

    try {
      await refreshAuth();
    } catch {
      // refreshAuth側で認証失敗処理を行うため、ここでは握りつぶす
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
};
