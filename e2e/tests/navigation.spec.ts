import { expect, test } from "@playwright/test";
import { createArticle } from "../helpers/articles";
import { registerAndLogin, uniqueSuffix } from "../helpers/auth";

test.describe("Navigation smoke", () => {
  test("top, article, search and user routes remain connected", async ({
    browser,
    request,
  }) => {
    const { user, context } = await registerAndLogin(browser, request, "nav");
    const suffix = uniqueSuffix();
    const title = `Navigation ${suffix}`;
    const article = await createArticle(context.request, title);
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    await page.goto(`/articles/${article.id}`);
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    await page.goto(`/search?q=${encodeURIComponent(title)}&page=1`);
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    await page.goto(`/user/${user.username}`);
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).toContain(`/user/${user.username}`);

    await context.close();
  });
});
