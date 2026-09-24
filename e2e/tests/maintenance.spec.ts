import { expect, test } from "@playwright/test";
import { login, registerAndLogin } from "../helpers/auth";

const admin = {
  identifier: process.env.KUON_E2E_ADMIN_IDENTIFIER ?? "",
  password: process.env.KUON_E2E_ADMIN_PASSWORD ?? "",
};

test.describe.serial("Maintenance mode smoke", () => {
  test("blocks normal DB access and returns to normal after disabling", async ({
    browser,
    request,
  }) => {
    test.skip(!admin.identifier || !admin.password, "Admin credentials are required");
    const normal = await registerAndLogin(browser, request, "maint");
    const adminContext = await login(browser, admin.identifier, admin.password);

    const settingsResponse = await adminContext.request.get("/api/admin/settings/server");
    expect(settingsResponse.status()).toBe(200);
    const settings = await settingsResponse.json();
    const maintenance = settings.find(
      (setting: { key: string }) => setting.key === "maintenance_mode",
    );
    test.skip(!maintenance || maintenance.readOnly, "maintenance_mode is environment controlled");

    try {
      const enable = await adminContext.request.put("/api/admin/settings/server", {
        data: { key: "maintenance_mode", value: "true" },
      });
      expect(enable.status()).toBe(200);

      const publicSettings = await request.get("/api/server/public-settings");
      expect(publicSettings.status()).toBe(200);
      expect((await publicSettings.json()).maintenanceMode).toBe(true);

      const blocked = await normal.context.request.get("/api/articles");
      expect(blocked.status()).toBe(503);
      expect((await blocked.json()).error.code).toBe("MAINTENANCE_MODE");

      const adminAccess = await adminContext.request.get("/api/admin/settings/server");
      expect(adminAccess.status()).toBe(200);
    } finally {
      const disable = await adminContext.request.put("/api/admin/settings/server", {
        data: { key: "maintenance_mode", value: "false" },
      });
      expect(disable.status()).toBe(200);
    }

    const restored = await normal.context.request.get("/api/articles");
    expect(restored.status()).toBe(200);
    await normal.context.close();
    await adminContext.close();
  });
});
