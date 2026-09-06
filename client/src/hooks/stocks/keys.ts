export const stockKeys = {
  all: ["stocks"] as const,
  lists: () => [...stockKeys.all, "lists"] as const,
  myLists: () => [...stockKeys.lists(), "mine"] as const,
  articleLists: (articleId: string) =>
    [...stockKeys.lists(), "article", articleId] as const,
  publicLists: () => [...stockKeys.lists(), "public"] as const,
  details: () => [...stockKeys.all, "detail"] as const,
  detail: (listId: string | undefined, page: number, q?: string) =>
    [...stockKeys.details(), listId ?? "all", page, q ?? ""] as const,
  likes: () => [...stockKeys.all, "likes"] as const,
  like: (listId: string) => [...stockKeys.likes(), listId] as const,
};
