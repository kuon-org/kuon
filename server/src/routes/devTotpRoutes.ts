import { Router } from "express";
import { verifyPending2FAToken } from "../utils/pending2faToken/index.js";
import { totpService } from "../services/totpService.js";

const router = Router();

// Never register the helper outside an explicitly configured development server.
if (process.env.NODE_ENV === "development") {
  router.get("/dev/totp", async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    res.set("X-Content-Type-Options", "nosniff");

    // Identity comes exclusively from the short-lived, HttpOnly login cookie.
    // Do not accept a user ID or put a bearer token in the URL/history.
    const pendingToken = req.cookies?.pending_2fa_token;
    if (req.query.flow !== "login" || typeof pendingToken !== "string") {
      return res.sendStatus(401);
    }

    let userId: string;
    try {
      ({ userId } = verifyPending2FAToken(pendingToken));
    } catch {
      return res.sendStatus(401);
    }

    const code = await totpService.getDevelopmentCode(userId);
    if (!code) return res.sendStatus(404);
    return res.type("text/plain").send(code);
  });
}

export default router;
