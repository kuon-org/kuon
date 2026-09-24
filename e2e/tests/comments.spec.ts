import { expect, test } from "@playwright/test";
import { createArticle } from "../helpers/articles";
import { registerAndLogin, uniqueSuffix } from "../helpers/auth";

test.describe("Comments smoke", () => {
  test("post, reply and soft-delete without breaking the comment tree", async ({
    browser,
    request,
  }) => {
    const { context } = await registerAndLogin(browser, request, "comment");
    const suffix = uniqueSuffix();
    const article = await createArticle(context.request, `Comments ${suffix}`);

    const parentResponse = await context.request.post(
      `/api/articles/${article.id}/comments`,
      { data: { body: `parent-${suffix}` } },
    );
    expect(parentResponse.status()).toBe(201);
    const parent = await parentResponse.json();

    const replyResponse = await context.request.post(
      `/api/articles/${article.id}/comments`,
      {
        data: {
          body: `reply-${suffix}`,
          parent_comment_id: parent.id,
        },
      },
    );
    expect(replyResponse.status()).toBe(201);
    const reply = await replyResponse.json();

    const beforeDelete = await context.request.get(
      `/api/articles/${article.id}/comments`,
    );
    expect(beforeDelete.status()).toBe(200);
    const before = await beforeDelete.json();
    expect(before.some((item: { id: string }) => item.id === parent.id)).toBe(true);
    expect(before.some((item: { id: string }) => item.id === reply.id)).toBe(true);

    const remove = await context.request.delete(
      `/api/articles/${article.id}/comments/${parent.id}`,
    );
    expect(remove.status()).toBe(200);

    const afterDelete = await context.request.get(
      `/api/articles/${article.id}/comments`,
    );
    expect(afterDelete.status()).toBe(200);
    const after = await afterDelete.json();
    const deletedParent = after.find((item: { id: string }) => item.id === parent.id);
    expect(deletedParent).toBeTruthy();
    expect(deletedParent.is_deleted).toBe(true);
    expect(deletedParent.body).toBeNull();
    expect(after.some((item: { id: string }) => item.id === reply.id)).toBe(true);
    await context.close();
  });
});
