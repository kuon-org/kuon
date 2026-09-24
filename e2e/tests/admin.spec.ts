import { expect, test } from "@playwright/test";
import { login, registerAndLogin } from "../helpers/auth";

const admin = {
  identifier: process.env.KUON_E2E_ADMIN_IDENTIFIER ?? "",
  password: process.env.KUON_E2E_ADMIN_PASSWORD ?? "",
};

test.describe("Admin smoke", () => {
  test("admin APIs and primary admin routes are reachable", async ({ browser }) => {
    test.skip(!admin.identifier || !admin.password, "Admin credentials are required");
    const context = await login(browser, admin.identifier, admin.password);

    const roles = await context.request.get("/api/admin/roles");
    expect(roles.status()).toBe(200);

    const users = await context.request.get("/api/admin/settings/users");
    expect(users.status()).toBe(200);

    const page = await context.newPage();
    for (const path of ["/admin", "/admin/users", "/admin/roles", "/admin/server-settings"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
      expect(page.url()).toContain(path);
    }
    await context.close();
  });

  test("general user cannot use admin APIs", async ({ browser, request }) => {
    const { context } = await registerAndLogin(browser, request, "nonadmin");
    const roles = await context.request.get("/api/admin/roles");
    expect(roles.status()).toBe(403);
    await context.close();
  });
});
