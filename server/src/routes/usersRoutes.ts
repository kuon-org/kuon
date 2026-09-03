import { Router, type NextFunction, type Request, type Response } from "express";
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

const ensureLocalRegistrationAllowed = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await localRegistrationService.getStatus();
    if (!status.allowed) {
      return res.status(403).json({
        message: "ローカルアカウントの新規登録は無効化されています",
      });
    }
    next();
  } catch (error) {
    console.error("Failed to check local registration availability", error);
    return res.status(500).json({ message: "登録設定の確認に失敗しました" });
  }
};

const validateAndNormalizeUsername = (req: Request, res: Response, next: NextFunction) => {
  const username = req.body?.username;
  if (typeof username !== "string" || !username.trim()) return res.status(400).json({ message: "ユーザ名は必須です" });

  const normalizedUsername = normalizeUsername(username);
  if (!isValidUsernameFormat(normalizedUsername)) {
    return res.status(400).json({ message: `ユーザ名は${USERNAME_MIN_LENGTH}〜${USERNAME_MAX_LENGTH}文字の英小文字・数字・_・-のみ使用でき、先頭と末尾は英数字にしてください` });
  }
  if (isReservedUsername(normalizedUsername)) return res.status(400).json({ message: "このユーザ名は予約されているため使用できません" });

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
    });
  } catch (error) {
    console.error("Failed to get registration status", error);
    res.status(500).json({ message: "登録設定の取得に失敗しました" });
  }
});
usersRouter.get("/users", requireSiteAuthentication, usersCtrl.getUsers);
usersRouter.get("/users/id/:userId", requireSiteAuthentication, usersCtrl.getUserById);
usersRouter.get("/users/:username", requireSiteAuthentication, usersCtrl.getUserByUsername);
usersRouter.get("/me", authenticateToken, usersCtrl.getMe);
usersRouter.get("/permissions/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "未ログインです" });
    const permissions = await permissionService.getUserPermissions(req.user.userId);
    return res.status(200).json({ permissions });
  } catch (error) {
    console.error("Failed to get current user permissions", error);
    return res.status(500).json({ message: "Permissionの取得に失敗しました" });
  }
});
usersRouter.post("/register", ensureLocalRegistrationAllowed, validateAndNormalizeUsername, usersCtrl.registerUser);
usersRouter.post("/refresh", attachRefreshExpiryHeaders, usersCtrl.refreshToken);
usersRouter.post("/logout", usersCtrl.logoutUser);
usersRouter.get("/devices", authenticateToken, usersCtrl.getDevices);
usersRouter.post("/logout/all", authenticateToken, usersCtrl.logoutAllDevices);
usersRouter.post("/logout/device/:sessionId", authenticateToken, usersCtrl.logoutDevice);
usersRouter.put("/users/:userId/password", usersCtrl.changePassword);
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
