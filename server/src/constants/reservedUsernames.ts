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

export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;

const reservedUsernameSet = new Set<string>(RESERVED_USERNAMES);

export const normalizeUsername = (username: string) =>
  username.trim().toLowerCase();

export const isReservedUsername = (username: string) =>
  reservedUsernameSet.has(normalizeUsername(username));

export const isValidUsernameFormat = (username: string) =>
  USERNAME_PATTERN.test(normalizeUsername(username));
