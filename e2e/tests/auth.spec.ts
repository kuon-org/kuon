import { expect, test } from "@playwright/test";
import { login, makeTestUser, registerUser } from "../helpers/auth";

test.describe("Authentication smoke", () => {
  test("register, login, refresh and logout keep session boundaries working", async ({
    browser,
    request,
  }) => {
    const fixture = makeTestUser("auth");
    const user = await registerUser(request, fixture);

    const badContext = await browser.newContext();
    const badLogin = await badContext.request.post("/api/login", {
      data: { identifier: user.username, password: `${user.password}-wrong` },
    });
    expect(badLogin.status()).toBe(401);
    await badContext.close();

    const context = await login(browser, user.username, user.password);

    const me = await context.request.get("/api/me");
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.id).toBe(user.id);
    expect(meBody.username).toBe(user.username);

    const refresh = await context.request.post("/api/refresh");
    expect(refresh.status()).toBe(200);

    const meAfterRefresh = await context.request.get("/api/me");
    expect(meAfterRefresh.status()).toBe(200);

    const logout = await context.request.post("/api/logout");
    expect(logout.status()).toBe(200);

    const meAfterLogout = await context.request.get("/api/me");
    expect(meAfterLogout.status()).toBe(401);
    await context.close();
  });
});
