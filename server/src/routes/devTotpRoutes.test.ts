import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

test("development helper requires a valid pending login and uses normal verification", async () => {
  process.env.NODE_ENV = "development";
  process.env.JWT_SECRET = "dev-totp-helper-test-secret";
  const { default: router } = await import("./devTotpRoutes.js");
  const { totpService } = await import("../services/totpService.js");
  const { TotpRepository } = await import("../repositories/totpRepository.js");
  const { TotpService } = await import("../services/totpService.js");
  const { createPending2FAToken } = await import("../utils/pending2faToken/index.js");
  const userId = "test-user";
  class TestRepository extends TotpRepository {
    findSecurity(id: string) {
      assert.equal(id, userId);
      return Promise.resolve({ user_id: id, is_2fa_enabled: true, totp_secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP" }) as ReturnType<InstanceType<typeof TotpRepository>["findSecurity"]>;
    }
  }
  const service = new TotpService(new TestRepository());
  const original = totpService.getDevelopmentCode;
  totpService.getDevelopmentCode = (id) => service.getDevelopmentCode(id);
  const request = (token?: string, query = { flow: "login" } as Record<string, string>) =>
    new Promise<{ status: number; body: string; headers: Map<string, string> }>((resolve, reject) => {
      const headers = new Map<string, string>();
      let status = 200;
      const res = {
        set(name: string, value: string) { headers.set(name.toLowerCase(), value); return res; },
        type(value: string) { headers.set("content-type", value); return res; },
        send(body: string) { resolve({ status, body, headers }); return res; },
        sendStatus(value: number) { status = value; return res.send(""); },
      };
      router({ method: "GET", url: "/dev/totp", query, cookies: { pending_2fa_token: token } } as unknown as Request,
        res as unknown as Response, (error?: unknown) => error ? reject(error) : resolve({ status: 404, body: "", headers }));
    });
  try {
    assert.equal((await request()).status, 401);
    assert.equal((await request("tampered")).status, 401);
    const expired = jwt.sign({ userId, purpose: "2fa" }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await request(expired)).status, 401);
    const wrongPurpose = jwt.sign({ userId, purpose: "access" }, process.env.JWT_SECRET);
    assert.equal((await request(wrongPurpose)).status, 401);
    const pending = createPending2FAToken(userId);
    const response = await request(pending, { flow: "login", userId: "other-user" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("content-type") ?? "", /^text\/plain/);
    const code = response.body;
    assert.match(code, /^\d{6}$/);
    await service.verify(userId, code);
    process.env.NODE_ENV = "production";
    assert.equal((await request(pending)).status, 404);
  } finally {
    totpService.getDevelopmentCode = original;
  }
});
