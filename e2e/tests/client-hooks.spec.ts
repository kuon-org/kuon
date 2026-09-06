import { expect, test, type Browser, type BrowserContext } from "@playwright/test";

const admin = {
  identifier: process.env.KUON_E2E_ADMIN_IDENTIFIER ?? "",
  password: process.env.KUON_E2E_ADMIN_PASSWORD ?? "",
};

const requireAdminCredentials = () => {
  expect(
    admin.identifier,
    "KUON_E2E_ADMIN_IDENTIFIER を設定してください",
  ).not.toBe("");
  expect(
    admin.password,
    "KUON_E2E_ADMIN_PASSWORD を設定してください",
  ).not.toBe("");
};

const login = async (browser: Browser): Promise<BrowserContext> => {
  const context = await browser.newContext();
  const response = await context.request.post("/api/login", {
    data: {
      identifier: admin.identifier,
      password: admin.password,
    },
  });

  expect(response.status(), "admin login failed").toBe(200);
  const body = await response.json();
  expect(body.requires2FA ?? false).toBe(false);
  return context;
};

const smokeRoutes = [
  "/",
  "/settings/account",
  "/settings/security",
  "/settings/notifications",
  "/settings/webhooks",
  "/admin",
  "/admin/server-settings",
  "/admin/webhooks",
  "/admin/server-events",
] as const;

test.describe("Client Hook regression", () => {
  test.beforeAll(() => {
    requireAdminCredentials();
  });

  test("article list does not prefetch article-specific stock lists", async ({
    browser,
  }) => {
    const context = await login(browser);
    const page = await context.newPage();
    const articleStockRequests: string[] = [];

    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        url.pathname === "/api/stocks/mylists" &&
        url.searchParams.has("articleId")
      ) {
        articleStockRequests.push(request.url());
      }
    });

    await page.goto("/");
    await expect(page.locator("#root")).not.toBeEmpty();
    await page.waitForTimeout(500);

    expect(
      articleStockRequests,
      "記事一覧の表示だけで articleId 単位のStock APIを発火しないこと",
    ).toEqual([]);

    await context.close();
  });

  for (const route of smokeRoutes) {
    test(`${route} renders without runtime errors`, async ({ browser }) => {
      const context = await login(browser);
      const page = await context.newPage();
      const pageErrors: string[] = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      const response = await page.goto(route);
      expect(response?.status(), `${route} should load successfully`).toBeLessThan(
        400,
      );
      await expect(page.locator("#root")).not.toBeEmpty();
      await page.waitForTimeout(300);

      expect(pageErrors, `${route} should not throw browser runtime errors`).toEqual(
        [],
      );

      await context.close();
    });
  }
});
