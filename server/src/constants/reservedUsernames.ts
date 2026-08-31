export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "api-docs",
  "auth",
  "drafts",
  "login",
  "maintenance",
  "register",
  "search",
  "settings",
  "share",
  "stock-feed",
  "stocks",
  "tags",
  "timeline",
  "trash",
  "trend",
  "uploads",
] as const;

export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 16;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;

const reservedUsernameSet = new Set<string>(RESERVED_USERNAMES);

export const normalizeUsername = (username: string) =>
  username.trim().toLowerCase();

export const isReservedUsername = (username: string) =>
  reservedUsernameSet.has(normalizeUsername(username));

export const isValidUsernameFormat = (username: string) => {
  const normalized = normalizeUsername(username);
  return (
    normalized.length >= USERNAME_MIN_LENGTH &&
    normalized.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(normalized)
  );
};

export const sanitizeExternalUsername = (username: unknown) => {
  const normalized = normalizeUsername(String(username ?? ""))
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, USERNAME_MAX_LENGTH)
    .replace(/[-_]+$/g, "");

  if (
    normalized.length < USERNAME_MIN_LENGTH ||
    !isValidUsernameFormat(normalized) ||
    isReservedUsername(normalized)
  ) {
    return null;
  }
  return normalized;
};
