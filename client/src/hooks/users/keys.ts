export const userKeys = {
  all: ["users"] as const,
  detail: (username?: string) => [...userKeys.all, "detail", username] as const,
  followingState: (userId?: string) =>
    [...userKeys.all, "following-state", userId] as const,
  following: (userId?: string) =>
    [...userKeys.all, "following", userId] as const,
  followers: (userId?: string) =>
    [...userKeys.all, "followers", userId] as const,
  commentCount: (userId?: string) =>
    [...userKeys.all, "comment-count", userId] as const,
  articleCount: (userId?: string) =>
    [...userKeys.all, "article-count", userId] as const,
  pickup: (userId?: string) => [...userKeys.all, "pickup", userId] as const,
  ranking: () => [...userKeys.all, "ranking"] as const,
};
