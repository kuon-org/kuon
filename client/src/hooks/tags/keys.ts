export const tagKeys = {
  all: ["tags"] as const,
  list: () => [...tagKeys.all, "list"] as const,
  detail: (slug?: string) => [...tagKeys.all, "detail", slug] as const,
  following: (userId?: string, page = 1, limit = 20) => [...tagKeys.all, "following", userId, page, limit] as const,
  myFollowing: () => [...tagKeys.all, "my-following"] as const,
  followState: (slug?: string) => [...tagKeys.all, "follow-state", slug] as const,
};
