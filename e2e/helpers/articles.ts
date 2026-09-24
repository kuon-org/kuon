import { expect, type APIRequestContext } from "@playwright/test";

export const createArticle = async (
  request: APIRequestContext,
  title: string,
  options: { rawContent?: string; tagIds?: string[] } = {},
) => {
  const rawContent =
    options.rawContent ?? `# ${title}\n\nE2E smoke article content`;
  const response = await request.post("/api/articles/create", {
    data: {
      title,
      raw_content: rawContent,
      status: "public",
      is_published: true,
      is_private: false,
      visibility: "public",
      tagIds: options.tagIds ?? [],
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
};

export const updateArticle = async (
  request: APIRequestContext,
  articleId: string,
  title: string,
  rawContent: string,
  tagIds: string[] = [],
) => {
  const response = await request.patch(`/api/articles/${articleId}/edit`, {
    data: {
      title,
      raw_content: rawContent,
      status: "public",
      is_published: true,
      is_private: false,
      visibility: "public",
      tagIds,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
};
