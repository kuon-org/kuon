import { expect, test } from "@playwright/test";
import { createArticle, updateArticle } from "../helpers/articles";
import { registerAndLogin, uniqueSuffix } from "../helpers/auth";

test.describe("Article CRUD smoke", () => {
  test("create, render, edit, trash and restore an article", async ({
    browser,
    request,
  }) => {
    const { context } = await registerAndLogin(browser, request, "article");
    const suffix = uniqueSuffix();
    const title = `E2E article ${suffix}`;
    const markdown = `# Markdown ${suffix}\n\n**smoke-content-${suffix}**`;
    const article = await createArticle(context.request, title, {
      rawContent: markdown,
    });

    const detail = await context.request.get(`/api/articles/${article.id}`);
    expect(detail.status()).toBe(200);
    expect((await detail.json()).title).toBe(title);

    const page = await context.newPage();
    await page.goto(`/articles/${article.id}`);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByText(`smoke-content-${suffix}`, { exact: true })).toBeVisible();

    const editedTitle = `${title} edited`;
    const editedMarkdown = `# Edited\n\nupdated-${suffix}`;
    await updateArticle(
      context.request,
      article.id,
      editedTitle,
      editedMarkdown,
    );

    const edited = await context.request.get(`/api/articles/${article.id}`);
    expect(edited.status()).toBe(200);
    const editedBody = await edited.json();
    expect(editedBody.title).toBe(editedTitle);
    expect(editedBody.raw_content).toContain(`updated-${suffix}`);

    const remove = await context.request.delete(`/api/articles/${article.id}`);
    expect(remove.status()).toBe(200);

    const removedDetail = await context.request.get(`/api/articles/${article.id}`);
    expect(removedDetail.status()).toBe(404);

    const trash = await context.request.get("/api/articles/trash/list");
    expect(trash.status()).toBe(200);
    expect((await trash.json()).some((item: { id: string }) => item.id === article.id)).toBe(true);

    const restore = await context.request.post(`/api/articles/${article.id}/restore`);
    expect(restore.status()).toBe(200);

    const restored = await context.request.get(`/api/articles/${article.id}`);
    expect(restored.status()).toBe(200);
    expect((await restored.json()).title).toBe(editedTitle);
    await context.close();
  });
});
