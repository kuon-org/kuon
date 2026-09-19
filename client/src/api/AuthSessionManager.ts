export type AuthSessionMetadata = {
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 30_000;
const ACCESS_TOKEN_EXPIRES_AT_HEADER = "X-Access-Token-Expires-At";
const REFRESH_TOKEN_EXPIRES_AT_HEADER = "X-Refresh-Token-Expires-At";

class AuthSessionManager {
  private metadata: AuthSessionMetadata | null = null;

  syncFromResponse(response: Response): void {
    const accessTokenExpiresAt = this.parseExpiresAt(
      response.headers.get(ACCESS_TOKEN_EXPIRES_AT_HEADER),
    );
    const refreshTokenExpiresAt = this.parseExpiresAt(
      response.headers.get(REFRESH_TOKEN_EXPIRES_AT_HEADER),
    );

    if (accessTokenExpiresAt === null || refreshTokenExpiresAt === null) {
      return;
    }

    this.metadata = {
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  shouldRefreshAccessToken(bufferMs = ACCESS_TOKEN_EXPIRY_BUFFER_MS): boolean {
    if (!this.metadata) return false;
    if (this.isRefreshTokenExpired()) return false;

    return Date.now() >= this.metadata.accessTokenExpiresAt - bufferMs;
  }

  isRefreshTokenExpired(): boolean {
    if (!this.metadata) return false;
    return Date.now() >= this.metadata.refreshTokenExpiresAt;
  }

  clear(): void {
    this.metadata = null;
  }

  private parseExpiresAt(value: string | null): number | null {
    if (!value) return null;

    const expiresAt = Date.parse(value);
    return Number.isNaN(expiresAt) ? null : expiresAt;
  }
}

const authSessionManager = new AuthSessionManager();

export default authSessionManager;
