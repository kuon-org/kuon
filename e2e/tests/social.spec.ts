import { expect, test } from "@playwright/test";
import { createArticle } from "../helpers/articles";
import { registerAndLogin, uniqueSuffix } from "../helpers/auth";

test.describe("Stock / Follow smoke", () => {
  test("toggle default stock and user follow", async ({ browser, request }) => {
    const first = await registerAndLogin(browser, request, "sociala");
    const second = await registerAndLogin(browser, request, "socialb");
    const article = await createArticle(
      second.context.request,
      `Social ${uniqueSuffix()}`,
    );

    const addStock = await first.context.request.post("/api/stocks/default/articles", {
      data: { articleId: article.id },
    });
    expect(addStock.status()).toBe(200);
    expect((await addStock.json()).added).toBe(true);

    const stockLists = await first.context.request.get(
      `/api/stocks/mylists?articleId=${article.id}`,
    );
    expect(stockLists.status()).toBe(200);
    expect(
      (await stockLists.json()).some(
        (list: { is_default?: boolean; isStored?: boolean }) =>
          list.is_default && list.isStored,
      ),
    ).toBe(true);

    const removeStock = await first.context.request.post(
      "/api/stocks/default/articles",
      { data: { articleId: article.id } },
    );
    expect(removeStock.status()).toBe(200);
    expect((await removeStock.json()).added).toBe(false);

    const follow = await first.context.request.post("/api/users/follow", {
      data: { followeeId: second.user.id },
    });
    expect(follow.status()).toBe(200);
    expect((await follow.json()).isFollow).toBe(true);

    const following = await first.context.request.get(
      `/api/users/${second.user.id}/isfollowing`,
    );
    expect(following.status()).toBe(200);
    expect(await following.json()).toEqual({ isFollow: true });

    const unfollow = await first.context.request.post("/api/users/follow", {
      data: { followeeId: second.user.id },
    });
    expect(unfollow.status()).toBe(200);
    expect((await unfollow.json()).isFollow).toBe(false);

    await first.context.close();
    await second.context.close();
  });
});
