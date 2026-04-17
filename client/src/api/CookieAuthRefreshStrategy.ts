import type { AuthRefreshStrategy } from "./FetchHttpClient/AuthRefreshStrategy";

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

      // 200 / 204 のみ成功扱い
      if (res.status === 200 || res.status === 204) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}

const authRefreshStrategy = new CookieAuthRefreshStrategy("/api");

export default authRefreshStrategy;
