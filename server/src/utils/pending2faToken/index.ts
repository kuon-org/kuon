import jwt from "jsonwebtoken";
import JWT_SECRET from "../sessionTokens/jwtSecret.js";

const PENDING_2FA_EXPIRES_IN = "5m";
export const PENDING_2FA_MAX_AGE_MS = 5 * 60 * 1000;

interface Pending2FAPayload {
  userId: string;
  purpose: "2fa";
}

export const createPending2FAToken = (userId: string) => {
  return jwt.sign(
    {
      userId,
      purpose: "2fa",
    } satisfies Pending2FAPayload,
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: PENDING_2FA_EXPIRES_IN,
    },
  );
};

export const verifyPending2FAToken = (token: string): Pending2FAPayload => {
  const decoded = jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    decoded.userId.length === 0 ||
    decoded.purpose !== "2fa"
  ) {
    throw new Error("Invalid pending 2FA token");
  }

  return {
    userId: decoded.userId,
    purpose: "2fa",
  };
};
