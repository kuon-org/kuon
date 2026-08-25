import type { AuthRefreshStrategy } from "./FetchHttpClient/AuthRefreshStrategy";
import authSessionManager from "./AuthSessionManager";

class CookieAuthRefreshStrategy implements AuthRefreshStrategy {
  private baseURL: string;
  private credentials: RequestCredentials;

  constructor(baseURL: string, credentials: RequestCredentials = "include") {
    this.baseURL = baseURL;
    this.credentials = credentials;
  }

  async refresh(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseURL}/refresh`, {
        method: "POST",
        credentials: this.credentials,
      });

      if (res.status === 200 || res.status === 204) {
        authSessionManager.syncFromResponse(res);
        return true;
      }

      authSessionManager.clear();
      return false;
    } catch {
      authSessionManager.clear();
      return false;
    }
  }
}

const authRefreshStrategy = new CookieAuthRefreshStrategy("/api");

export default authRefreshStrategy;
