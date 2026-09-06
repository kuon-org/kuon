export const commentKeys = {
  all: ["comments"] as const,
  list: (articleId: string) => [...commentKeys.all, "article", articleId] as const,
  detail: (commentId: string) => [...commentKeys.all, "detail", commentId] as const,
  likeUsers: (commentId: string) => [...commentKeys.all, "likes", commentId] as const,
  isLiked: (commentId: string) => [...commentKeys.all, "is-liked", commentId] as const,
};
