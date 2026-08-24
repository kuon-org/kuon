import { totpService } from "../../services/totpService.js";

/**
 * @deprecated 新規コードでは TotpService を直接利用してください。
 * AuthService の段階的移行用ラッパーです。
 */
export const isTotpEnabledForUser = (userId: string) =>
  totpService.isEnabled(userId);

/** @deprecated 新規コードでは TotpService.verify() を利用してください。 */
export const verifyTotpForUser = (userId: string, token: string) =>
  totpService.verify(userId, token);
