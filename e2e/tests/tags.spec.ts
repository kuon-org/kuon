import { expect, test } from "@playwright/test";
import { createArticle } from "../helpers/articles";
import { login, registerAndLogin, uniqueSuffix } from "../helpers/auth";

const admin = {
  identifier: process.env.KUON_E2E_ADMIN_IDENTIFIER ?? "",
  password: process.env.KUON_E2E_ADMIN_PASSWORD ?? "",
};

test.describe("Tags smoke", () => {
  test("create tag, attach it to an article and toggle follow", async ({
    browser,
    request,
  }) => {
    test.skip(!admin.identifier || !admin.password, "Admin credentials are required");
    const adminContext = await login(browser, admin.identifier, admin.password);
    const suffix = uniqueSuffix().replace(/[^a-z0-9-]/g, "");
    const slug = `e2e-${suffix}`.slice(0, 40);
    const tagName = `E2E ${suffix}`;

    const createTagResponse = await adminContext.request.post("/api/tags", {
      data: {
        name: tagName,
        slug,
        description: "E2E tag",
      },
    });
    expect(createTagResponse.status(), await createTagResponse.text()).toBe(200);
    const tag = await createTagResponse.json();

    const { context } = await registerAndLogin(browser, request, "taguser");
    const article = await createArticle(context.request, `Tagged ${suffix}`, {
      tagIds: [tag.id],
    });

    const tagDetail = await context.request.get(`/api/tags/${slug}`);
    expect(tagDetail.status()).toBe(200);
    expect((await tagDetail.json()).articleCount).toBeGreaterThanOrEqual(1);

    const taggedArticles = await context.request.get("/api/articles", {
      params: { tagId: tag.id },
    });
    expect(taggedArticles.status()).toBe(200);
    expect((await taggedArticles.json()).articles).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: article.id })]),
    );

    const tagPage = await context.newPage();
    await tagPage.goto(`/tags/${slug}`);
    await expect(tagPage.getByText(article.title, { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    const follow = await context.request.post(`/api/tags/${slug}/follow`);
    expect(follow.status()).toBe(200);
    expect((await follow.json()).isFollowing).toBe(true);

    const following = await context.request.get(`/api/tags/${slug}/isFollowing`);
    expect(following.status()).toBe(200);
    expect((await following.json()).isFollow).toBe(true);

    const unfollow = await context.request.post(`/api/tags/${slug}/follow`);
    expect(unfollow.status()).toBe(200);
    expect((await unfollow.json()).isFollowing).toBe(false);

    const update = await adminContext.request.post("/api/tags", {
      data: {
        name: `E2E-edited-${suffix}`,
        slug,
        description: "edited by E2E",
      },
    });
    expect(update.status()).toBe(200);

    await context.close();
    await adminContext.close();
  });
});
