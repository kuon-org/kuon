export const articleKeys = {
  all: ["articles"] as const,
  detail: (articleId: string) =>
    [...articleKeys.all, "detail", articleId] as const,
  recommends: () => [...articleKeys.all, "recommends"] as const,
  trends: () => [...articleKeys.all, "trends"] as const,
  ownership: (articleId: string) =>
    [...articleKeys.all, "ownership", articleId] as const,
  likeUsers: (articleId: string) =>
    [...articleKeys.all, "likes", articleId] as const,
  isLiked: (articleId: string) =>
    [...articleKeys.all, "is-liked", articleId] as const,
  mine: () => [...articleKeys.all, "mine"] as const,
  trash: () => [...articleKeys.all, "trash"] as const,
  marp: (articleId: string) => [...articleKeys.all, "marp", articleId] as const,
};
