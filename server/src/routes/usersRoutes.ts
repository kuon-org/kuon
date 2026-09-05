import { Router, type NextFunction, type Request, type Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import { authenticateToken, type AuthRequest } from "../middlewares/auth.js";
import { requireSiteAuthentication } from "../middlewares/siteAccess.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { UsersService } from "../services/usersService.js";
import { UsersController } from "../controllers/usersController.js";
import { UploadImagesRepository } from "../repositories/uploadImagesRepository.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { TagsRepository } from "../repositories/tagsRepository.js";
import { TagsService } from "../services/tagsService.js";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { serverSettingsService } from "../services/serverSettingsService.js";
import { localRegistrationService } from "../services/localRegistrationService.js";
import { emailVerificationService } from "../services/emailVerificationService.js";
import { permissionService } from "../services/permissionService.js";
import { userWebhookService } from "../services/userWebhookService.js";
import { webhookPreviewService } from "../services/webhookPreviewService.js";
import { UserWebhookController } from "../controllers/userWebhookController.js";
import {
  RESERVED_USERNAMES,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  isReservedUsername,
  isValidUsernameFormat,
  normalizeUsername,
} from "../constants/reservedUsernames.js";
import { ACCESS_TOKEN_MAX_AGE_MS, REFRESH_TOKEN_MAX_AGE_MS } from "../utils/sessionTokens/index.js";

const usersRouter = Router();
const usersService = new UsersService(new UsersRepository(), new ArticlesRepository(), serverSettingsService);
const uploadImagesService = new UploadImagesService(new UploadImagesRepository());
const tagsService = new TagsService(new TagsRepository());
const usersCtrl = new UsersController(usersService, tagsService, uploadImagesService);
const userWebhookCtrl = new UserWebhookController(userWebhookService, webhookPreviewService);

const attachRefreshExpiryHeaders = (_req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  res.setHeader("X-Access-Token-Expires-At", new Date(now + ACCESS_TOKEN_MAX_AGE_MS).toISOString());
  res.setHeader("X-Refresh-Token-Expires-At", new Date(now + REFRESH_TOKEN_MAX_AGE_MS).toISOString());
  next();
};

const ensureLocalRegistrationAllowed = async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    const status = await localRegistrationService.getStatus();
    if (!status.allowed) {
      return next(
        new AppError(
          403,
          "LOCAL_REGISTRATION_DISABLED",
          "Local account registration is disabled",
        ),
      );
    }
    next();
  } catch (error) {
    console.error("Failed to check local registration availability", error);
    return next(
      new AppError(
        500,
        "REGISTRATION_STATUS_CHECK_FAILED",
        "Failed to check registration status",
      ),
    );
  }
};

const ensureOwnUser = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required"));
  }
  if (req.user.userId !== String(req.params.userId)) {
    return next(
      new AppError(403, "PASSWORD_CHANGE_FORBIDDEN", "Cannot change another user's password"),
    );
  }
  next();
};

const validateAndNormalizeUsername = (req: Request, _res: Response, next: NextFunction) => {
  const username = req.body?.username;
  if (typeof username !== "string" || !username.trim()) {
    return next(new ValidationError({ username: ["USERNAME_REQUIRED"] }));
  }

  const normalizedUsername = normalizeUsername(username);
  if (!isValidUsernameFormat(normalizedUsername)) {
    return next(new ValidationError({ username: ["USERNAME_INVALID_FORMAT"] }));
  }
  if (isReservedUsername(normalizedUsername)) {
    return next(new AppError(400, "USERNAME_RESERVED", "Username is reserved"));
  }

  req.body.username = normalizedUsername;
  next();
};

usersRouter.get("/username-rules", (_req, res) => {
  res.json({ reservedUsernames: RESERVED_USERNAMES, pattern: "^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$", minLength: USERNAME_MIN_LENGTH, maxLength: USERNAME_MAX_LENGTH });
});
usersRouter.get("/registration-status", async (_req, res) => {
  try {
    const status = await localRegistrationService.getStatus();
    res.status(200).json({
      localAccountRegistrationAllowed: status.allowed,
      initialSetup: status.isInitialSetup,
      emailVerificationRequired:
        !status.isInitialSetup && emailVerificationService.isRequired(),
    });
  } catch (error) {
    console.error("Failed to get registration status", error);
    throw new AppError(500, "REGISTRATION_STATUS_FETCH_FAILED", "Failed to fetch registration status");
  }
});
usersRouter.get("/email-verification/verify", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) throw new ValidationError({ token: ["EMAIL_VERIFICATION_TOKEN_REQUIRED"] });

  try {
    await emailVerificationService.verify(token);
    return res.status(200).json({ message: "メールアドレスの確認が完了しました" });
  } catch (error) {
    if (error instanceof Error && error.message === "VerificationTokenExpired") {
      throw new AppError(
        410,
        "EMAIL_VERIFICATION_TOKEN_EXPIRED",
        "Email verification token has expired",
      );
    }
    throw new AppError(
      400,
      "EMAIL_VERIFICATION_TOKEN_INVALID",
      "Email verification token is invalid or already used",
    );
  }
});
usersRouter.post("/email-verification/resend", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!email) throw new ValidationError({ email: ["EMAIL_REQUIRED"] });

  try {
    await emailVerificationService.resend(email);
    return res.status(200).json({
      message: "未確認のアカウントが存在する場合、確認メールを再送しました",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VerificationResendCooldown") {
      throw new AppError(429, "EMAIL_VERIFICATION_RESEND_RATE_LIMITED", "Verification resend rate limited");
    }
    if (error instanceof Error && error.message === "SmtpNotConfigured") {
      throw new AppError(503, "EMAIL_DELIVERY_UNAVAILABLE", "Email delivery is unavailable");
    }
    console.error("Verification email resend failed", error);
    throw new AppError(500, "EMAIL_VERIFICATION_RESEND_FAILED", "Failed to resend verification email");
  }
});
usersRouter.get("/users", requireSiteAuthentication, usersCtrl.getUsers);
usersRouter.get("/users/id/:userId", requireSiteAuthentication, usersCtrl.getUserById);
usersRouter.get("/users/:username", requireSiteAuthentication, usersCtrl.getUserByUsername);
usersRouter.get("/me", authenticateToken, usersCtrl.getMe);
usersRouter.get("/permissions/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
  try {
    const permissions = await permissionService.getUserPermissions(req.user.userId);
    return res.status(200).json({ permissions });
  } catch (error) {
    console.error("Failed to get current user permissions", error);
    throw new AppError(500, "PERMISSIONS_FETCH_FAILED", "Failed to fetch permissions");
  }
});
usersRouter.post("/register", ensureLocalRegistrationAllowed, validateAndNormalizeUsername, usersCtrl.registerUser);
usersRouter.post("/refresh", attachRefreshExpiryHeaders, usersCtrl.refreshToken);
usersRouter.post("/logout", usersCtrl.logoutUser);
usersRouter.get("/devices", authenticateToken, usersCtrl.getDevices);
usersRouter.post("/logout/all", authenticateToken, usersCtrl.logoutAllDevices);
usersRouter.post("/logout/device/:sessionId", authenticateToken, usersCtrl.logoutDevice);
usersRouter.put("/users/:userId/password", authenticateToken, ensureOwnUser, usersCtrl.changePassword);
usersRouter.put("/users/update/info", authenticateToken, usersCtrl.updateUserInfo);
usersRouter.put("/users/update/username", authenticateToken, validateAndNormalizeUsername, usersCtrl.updateUsername);
usersRouter.post("/users/follow", authenticateToken, usersCtrl.toggleFollow);
usersRouter.get("/users/:followeeId/isfollowing", authenticateToken, usersCtrl.isFollowing);
usersRouter.get("/users/:userId/follower", requireSiteAuthentication, usersCtrl.getFollowers);
usersRouter.get("/users/:userId/follow", requireSiteAuthentication, usersCtrl.getFollowings);
usersRouter.get("/users/settings/uploaded_images", authenticateToken, usersCtrl.getUploadedImages);
usersRouter.get("/users/settings/idpinfo", authenticateToken, usersCtrl.getUserIdentities);
usersRouter.post("/users/settings/upload_avatar", authenticateToken, usersCtrl.uploadLocalAvatar);
usersRouter.get("/users/:userId/following_tags", requireSiteAuthentication, usersCtrl.getFollowingTags);
usersRouter.get("/users/tags/me", authenticateToken, usersCtrl.getMyFollowingtags);
usersRouter.get("/users/:userId/pickup", requireSiteAuthentication, usersCtrl.getPickupArticles);
usersRouter.post("/users/pickup/create", authenticateToken, usersCtrl.createPickupArticle);
usersRouter.post("/users/pickup/delete", authenticateToken, usersCtrl.deletePickupArticle);
usersRouter.get("/users/:userId/comments", requireSiteAuthentication, usersCtrl.getCommentCount);
usersRouter.get("/users/:userId/articles", requireSiteAuthentication, usersCtrl.getArticleCount);
usersRouter.get("/users/ranking/all", requireSiteAuthentication, usersCtrl.getAllRanking);
usersRouter.get("/users/settings/api-keys", authenticateToken, usersCtrl.getApiKeys);
usersRouter.post("/users/settings/api-keys", authenticateToken, usersCtrl.createApiKey);
usersRouter.delete("/users/settings/api-keys/:apiKeyId", authenticateToken, usersCtrl.revokeApiKey);
usersRouter.get("/users/settings/webhooks", authenticateToken, userWebhookCtrl.getAll);
usersRouter.post("/users/settings/webhooks", authenticateToken, userWebhookCtrl.create);
usersRouter.get("/users/settings/webhooks/metadata", authenticateToken, userWebhookCtrl.getMetadata);
usersRouter.post("/users/settings/webhooks/preview", authenticateToken, userWebhookCtrl.preview);
usersRouter.post("/users/settings/webhooks/test", authenticateToken, userWebhookCtrl.testSend);
usersRouter.get("/users/settings/webhooks/:id", authenticateToken, userWebhookCtrl.getById);
usersRouter.put("/users/settings/webhooks/:id", authenticateToken, userWebhookCtrl.update);
usersRouter.patch("/users/settings/webhooks/:id/active", authenticateToken, userWebhookCtrl.setActive);
usersRouter.get("/users/settings/webhooks/:id/deliveries", authenticateToken, userWebhookCtrl.getDeliveries);
usersRouter.delete("/users/settings/webhooks/:id", authenticateToken, userWebhookCtrl.delete);

export default usersRouter;
