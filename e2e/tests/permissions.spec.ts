import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
} from "@playwright/test";

const admin = {
  identifier: process.env.KUON_E2E_ADMIN_IDENTIFIER ?? "",
  password: process.env.KUON_E2E_ADMIN_PASSWORD ?? "",
};

const runId = Date.now().toString(36);
const userSuffix = runId.slice(-4);
const password = "KuonE2E!123456";

const users = {
  a: {
    username: `e2e-a-${userSuffix}`,
    email: `e2e-user-a-${runId}@example.test`,
    password,
  },
  b: {
    username: `e2e-b-${userSuffix}`,
    email: `e2e-user-b-${runId}@example.test`,
    password,
  },
  c: {
    username: `e2e-c-${userSuffix}`,
    email: `e2e-user-c-${runId}@example.test`,
    password,
  },
  roleManager: {
    username: `e2e-rm-${userSuffix}`,
    email: `e2e-role-manager-${runId}@example.test`,
    password,
  },
};

type UserFixture = (typeof users)[keyof typeof users] & { id: string };
type Role = {
  id: string;
  name: string;
  display_name: string | null;
  permissions: string[];
};

const requireAdminCredentials = () => {
  expect(
    admin.identifier,
    "KUON_E2E_ADMIN_IDENTIFIER を設定してください",
  ).not.toBe("");
  expect(admin.password, "KUON_E2E_ADMIN_PASSWORD を設定してください").not.toBe(
    "",
  );
};

const login = async (
  browser: Browser,
  identifier: string,
  userPassword: string,
): Promise<BrowserContext> => {
  const context = await browser.newContext();
  const response = await context.request.post("/api/login", {
    data: { identifier, password: userPassword },
  });
  expect(response.status(), `login failed: ${identifier}`).toBe(200);
  const body = await response.json();
  expect(body.requires2FA ?? false).toBe(false);
  return context;
};

const register = async (
  request: APIRequestContext,
  fixture: (typeof users)[keyof typeof users],
): Promise<UserFixture> => {
  const response = await request.post("/api/register", {
    data: {
      username: fixture.username,
      email: fixture.email,
      password: fixture.password,
      displayName: fixture.username,
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return { ...fixture, id: body.user.id };
};

const getRoles = async (request: APIRequestContext): Promise<Role[]> => {
  const response = await request.get("/api/admin/roles");
  expect(response.status()).toBe(200);
  return response.json();
};

const assignRoles = async (
  request: APIRequestContext,
  userId: string,
  roleIds: string[],
) => {
  const response = await request.put(
    `/api/admin/settings/users/${userId}/roles`,
    {
      data: { roleIds },
    },
  );
  expect(response.status()).toBe(200);
};

const createRole = async (
  request: APIRequestContext,
  name: string,
  displayName: string,
  permissions: string[],
): Promise<Role> => {
  const response = await request.post("/api/admin/roles", {
    data: { name, displayName, permissions },
  });
  expect(response.status()).toBe(201);
  return response.json();
};

const createArticle = async (request: APIRequestContext, title: string) => {
  const response = await request.post("/api/articles/create", {
    data: {
      title,
      raw_content: `# ${title}\n\nE2E article`,
      status: "public",
      is_published: true,
      is_private: false,
      tagIds: [],
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
};

const createComment = async (
  request: APIRequestContext,
  articleId: string,
  body: string,
) => {
  const response = await request.post(`/api/articles/${articleId}/comments`, {
    data: { body },
  });
  expect(response.status()).toBe(201);
  return response.json();
};

test.describe.serial("Role / Permission authorization", () => {
  let adminContext: BrowserContext;
  let userA: UserFixture;
  let userB: UserFixture;
  let userC: UserFixture;
  let roleManagerUser: UserFixture;
  let generalRole: Role;
  let readonlyRole: Role;
  let moderatorRole: Role;
  let adminRole: Role;
  let writerRole: Role;
  let commentModeratorRole: Role;
  let roleManagerRole: Role;
  let articleA: { id: string };

  test.beforeAll(async ({ browser, request }) => {
    requireAdminCredentials();

    userA = await register(request, users.a);
    userB = await register(request, users.b);
    userC = await register(request, users.c);
    roleManagerUser = await register(request, users.roleManager);

    adminContext = await login(browser, admin.identifier, admin.password);
    const roles = await getRoles(adminContext.request);
    generalRole = roles.find((role) => role.name === "general")!;
    readonlyRole = roles.find((role) => role.name === "readonly")!;
    moderatorRole = roles.find((role) => role.name === "moderator")!;
    adminRole = roles.find((role) => role.name === "admin")!;

    expect(generalRole).toBeTruthy();
    expect(readonlyRole).toBeTruthy();
    expect(moderatorRole).toBeTruthy();
    expect(adminRole).toBeTruthy();
  });

  test.afterAll(async () => {
    await adminContext?.close();
  });

  test("Scenario 1: General can manage own content but not other users content", async ({
    browser,
  }) => {
    await assignRoles(adminContext.request, userA.id, [generalRole.id]);
    const context = await login(browser, userA.username, userA.password);
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByText("記事を作成", { exact: false })).toBeVisible();

    articleA = await createArticle(context.request, `E2E Article A ${runId}`);

    const editOwn = await context.request.patch(
      `/api/articles/${articleA.id}/edit`,
      {
        data: {
          title: `E2E Article A edited ${runId}`,
          raw_content: "edited by owner",
          status: "public",
          is_published: true,
          is_private: false,
          tagIds: [],
        },
      },
    );
    expect(editOwn.status()).toBe(200);

    const comment = await createComment(
      context.request,
      articleA.id,
      "comment by user-a",
    );
    expect(comment.id).toBeTruthy();

    const disposable = await createArticle(
      context.request,
      `E2E Disposable ${runId}`,
    );
    const deleteOwn = await context.request.delete(
      `/api/articles/${disposable.id}`,
    );
    expect(deleteOwn.status()).toBe(200);

    const adminArticle = await createArticle(
      adminContext.request,
      `E2E Admin Article ${runId}`,
    );
    const readOther = await context.request.get(
      `/api/articles/${adminArticle.id}`,
    );
    expect(readOther.status()).toBe(200);

    const editOther = await context.request.patch(
      `/api/articles/${adminArticle.id}/edit`,
      {
        data: { title: "forbidden edit" },
      },
    );
    expect(editOther.status()).toBe(403);

    const deleteOther = await context.request.delete(
      `/api/articles/${adminArticle.id}`,
    );
    expect(deleteOther.status()).toBe(403);

    await context.close();
  });

  test("Scenario 2: Readonly can read but cannot create or comment", async ({
    browser,
  }) => {
    await assignRoles(adminContext.request, userB.id, [readonlyRole.id]);
    const context = await login(browser, userB.username, userB.password);
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByText("記事を作成", { exact: false })).toHaveCount(0);

    const read = await context.request.get(`/api/articles/${articleA.id}`);
    expect(read.status()).toBe(200);

    await page.goto("/drafts/new");
    const create = await context.request.post("/api/articles/create", {
      data: {
        title: "Readonly must not create",
        raw_content: "forbidden",
        status: "public",
        is_published: true,
        is_private: false,
        tagIds: [],
      },
    });
    expect(create.status()).toBe(403);

    const comment = await context.request.post(
      `/api/articles/${articleA.id}/comments`,
      {
        data: { body: "Readonly must not comment" },
      },
    );
    expect(comment.status()).toBe(403);

    await context.close();
  });

  test("Scenario 3: Moderator can manage others content but not system administration", async ({
    browser,
  }) => {
    await assignRoles(adminContext.request, userC.id, [moderatorRole.id]);
    const userAContext = await login(browser, userA.username, userA.password);
    const moderatorContext = await login(
      browser,
      userC.username,
      userC.password,
    );

    const editOther = await moderatorContext.request.patch(
      `/api/articles/${articleA.id}/edit`,
      {
        data: {
          title: `Edited by moderator ${runId}`,
          raw_content: "moderator edit",
          status: "public",
          is_published: true,
          is_private: false,
          tagIds: [],
        },
      },
    );
    expect(editOther.status()).toBe(200);

    const articleToDelete = await createArticle(
      userAContext.request,
      `Delete by moderator ${runId}`,
    );
    const deleteOther = await moderatorContext.request.delete(
      `/api/articles/${articleToDelete.id}`,
    );
    expect(deleteOther.status()).toBe(200);

    const comment = await createComment(
      userAContext.request,
      articleA.id,
      "delete me by moderator",
    );
    const deleteComment = await moderatorContext.request.delete(
      `/api/articles/${articleA.id}/comments/${comment.id}`,
    );
    expect(deleteComment.status()).toBe(200);

    expect(
      (await moderatorContext.request.get("/api/admin/roles")).status(),
    ).toBe(403);
    expect(
      (await moderatorContext.request.get("/api/admin/idp_list")).status(),
    ).toBe(403);
    expect(
      (
        await moderatorContext.request.post("/api/admin/backup/export")
      ).status(),
    ).toBe(403);

    await userAContext.close();
    await moderatorContext.close();
  });

  test("Scenario 4: custom Writer role follows exactly the configured permissions", async ({
    browser,
  }) => {
    writerRole = await createRole(
      adminContext.request,
      `writer-${runId}`,
      `Writer ${runId}`,
      [
        "article.read",
        "article.create",
        "article.update.own",
        "comment.create",
      ],
    );
    await assignRoles(adminContext.request, userB.id, [writerRole.id]);

    const context = await login(browser, userB.username, userB.password);
    const own = await createArticle(context.request, `Writer Article ${runId}`);

    const editOwn = await context.request.patch(
      `/api/articles/${own.id}/edit`,
      {
        data: {
          title: `Writer edited ${runId}`,
          raw_content: "writer edit",
          status: "public",
          is_published: true,
          is_private: false,
          tagIds: [],
        },
      },
    );
    expect(editOwn.status()).toBe(200);

    expect(
      (await context.request.delete(`/api/articles/${own.id}`)).status(),
    ).toBe(403);
    expect(
      (
        await context.request.patch(`/api/articles/${articleA.id}/edit`, {
          data: { title: "no" },
        })
      ).status(),
    ).toBe(403);

    await context.close();
  });

  test("Scenario 5: multiple roles are combined and removed permissions disappear", async ({
    browser,
  }) => {
    commentModeratorRole = await createRole(
      adminContext.request,
      `comment-moderator-${runId}`,
      `Comment Moderator ${runId}`,
      ["comment.delete.any"],
    );
    await assignRoles(adminContext.request, userB.id, [
      writerRole.id,
      commentModeratorRole.id,
    ]);

    const userAContext = await login(browser, userA.username, userA.password);
    let context = await login(browser, userB.username, userB.password);
    const comment = await createComment(
      userAContext.request,
      articleA.id,
      "multi-role delete target",
    );

    expect(
      (
        await context.request.delete(
          `/api/articles/${articleA.id}/comments/${comment.id}`,
        )
      ).status(),
    ).toBe(200);
    expect((await context.request.get("/api/permissions/me")).status()).toBe(
      200,
    );

    await assignRoles(adminContext.request, userB.id, [writerRole.id]);
    await context.close();
    context = await login(browser, userB.username, userB.password);

    const comment2 = await createComment(
      userAContext.request,
      articleA.id,
      "permission removed target",
    );
    expect(
      (
        await context.request.delete(
          `/api/articles/${articleA.id}/comments/${comment2.id}`,
        )
      ).status(),
    ).toBe(403);

    await userAContext.close();
    await context.close();
  });

  test("Scenario 6: Role Manager cannot grant a permission it does not have", async ({
    browser,
  }) => {
    roleManagerRole = await createRole(
      adminContext.request,
      `role-manager-${runId}`,
      `Role Manager ${runId}`,
      ["role.read", "role.create", "role.update"],
    );
    await assignRoles(adminContext.request, roleManagerUser.id, [
      roleManagerRole.id,
    ]);

    const context = await login(
      browser,
      roleManagerUser.username,
      roleManagerUser.password,
    );
    const escalation = await context.request.post("/api/admin/roles", {
      data: {
        name: `illegal-backup-${runId}`,
        displayName: "Illegal Backup Role",
        permissions: ["system.backup.execute"],
      },
    });
    expect(escalation.status()).toBe(403);

    await context.close();
  });

  test("Scenario 7: the last Admin cannot be demoted, but one of two Admins can", async () => {
    const usersResponse = await adminContext.request.get(
      "/api/admin/settings/users",
    );
    expect(usersResponse.status()).toBe(200);
    const allUsers = (await usersResponse.json()) as Array<{
      id: string;
      username: string;
      roles: Array<{ name: string }>;
    }>;
    const admins = allUsers.filter((user) =>
      user.roles.some((role) => role.name === "admin"),
    );

    test.skip(
      admins.length !== 1,
      `Scenario 7 requires exactly one Admin before the test (actual: ${admins.length})`,
    );

    const originalAdmin = admins[0];
    const generalOnly = await adminContext.request.put(
      `/api/admin/settings/users/${originalAdmin.id}/roles`,
      { data: { roleIds: [generalRole.id] } },
    );
    expect(generalOnly.status()).toBe(400);

    await assignRoles(adminContext.request, userC.id, [adminRole.id]);

    const demoteOriginal = await adminContext.request.put(
      `/api/admin/settings/users/${originalAdmin.id}/roles`,
      { data: { roleIds: [generalRole.id] } },
    );
    expect(demoteOriginal.status()).toBe(200);
  });
});
