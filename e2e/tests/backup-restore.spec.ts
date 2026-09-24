import { expect, test } from "@playwright/test";
import { createArticle } from "../helpers/articles";
import { login, uniqueSuffix } from "../helpers/auth";

const admin = {
  identifier: process.env.KUON_E2E_ADMIN_IDENTIFIER ?? "",
  password: process.env.KUON_E2E_ADMIN_PASSWORD ?? "",
};

const runDestructive = process.env.KUON_E2E_DESTRUCTIVE === "true";

test.describe.serial("Backup / Restore release smoke", () => {
  test("export and restore a backup containing a known article", async ({ browser }) => {
    test.skip(!runDestructive, "Set KUON_E2E_DESTRUCTIVE=true for restore tests");
    test.skip(!admin.identifier || !admin.password, "Admin credentials are required");

    const context = await login(browser, admin.identifier, admin.password);
    const article = await createArticle(
      context.request,
      `Backup restore ${uniqueSuffix()}`,
    );

    const backup = await context.request.post("/api/admin/backup/export");
    expect(backup.status()).toBe(200);
    const bytes = await backup.body();
    expect(bytes.byteLength).toBeGreaterThan(0);

    const restore = await context.request.post("/api/admin/backup/restore", {
      multipart: {
        backup: {
          name: "kuon-e2e-backup.zip",
          mimeType: "application/zip",
          buffer: bytes,
        },
      },
    });
    expect(restore.status(), await restore.text()).toBe(200);

    const publicSettings = await context.request.get("/api/server/public-settings");
    expect(publicSettings.status()).toBe(200);
    expect((await publicSettings.json()).maintenanceMode).toBe(false);

    // Restore invalidates sessions, so use the public article endpoint here.
    const articleAfterRestore = await context.request.get(`/api/articles/${article.id}`);
    expect(articleAfterRestore.status()).toBe(200);
    await context.close();
  });
});
