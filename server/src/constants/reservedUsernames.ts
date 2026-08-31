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

const reservedUsernameSet = new Set<string>(RESERVED_USERNAMES);

export const isReservedUsername = (username: string) =>
  reservedUsernameSet.has(username.trim().toLowerCase());
