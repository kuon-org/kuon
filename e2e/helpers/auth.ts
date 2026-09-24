import {
  expect,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
} from "@playwright/test";

export type TestUserInput = {
  username: string;
  email: string;
  password: string;
  displayName?: string;
};

export type TestUser = TestUserInput & { id: string };

export const uniqueSuffix = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const makeTestUser = (prefix: string): TestUserInput => {
  const suffix = uniqueSuffix();
  const usernameSuffix = suffix.replace(/[^a-z0-9]/g, "").slice(-8);
  return {
    username: `${prefix}-${usernameSuffix}`.slice(0, 16),
    email: `${prefix}-${suffix}@example.test`,
    password: "KuonE2E!123456",
    displayName: `E2E ${prefix}`,
  };
};

export const registerUser = async (
  request: APIRequestContext,
  user: TestUserInput,
): Promise<TestUser> => {
  const response = await request.post("/api/register", {
    data: {
      username: user.username,
      email: user.email,
      password: user.password,
      displayName: user.displayName ?? user.username,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  const body = await response.json();
  return { ...user, id: body.user.id };
};

export const login = async (
  browser: Browser,
  identifier: string,
  password: string,
): Promise<BrowserContext> => {
  const context = await browser.newContext();
  const response = await context.request.post("/api/login", {
    data: { identifier, password },
  });
  expect(response.status(), `login failed: ${identifier}`).toBe(200);
  const body = await response.json();
  expect(body.requires2FA ?? false).toBe(false);
  return context;
};

export const registerAndLogin = async (
  browser: Browser,
  request: APIRequestContext,
  prefix: string,
) => {
  const user = await registerUser(request, makeTestUser(prefix));
  const context = await login(browser, user.username, user.password);
  return { user, context };
};
