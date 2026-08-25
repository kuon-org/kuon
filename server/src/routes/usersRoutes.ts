import { Router, type NextFunction, type Request, type Response } from "express";
import { authenticateToken } from "../middlewares/auth.js";
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
import { userWebhookService } from "../services/userWebhookService.js";
import { webhookPreviewService } from "../services/webhookPreviewService.js";
import { UserWebhookController } from "../controllers/userWebhookController.js";
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../utils/sessionTokens/index.js";

const usersRouter = Router();

const usersService = new UsersService(
  new UsersRepository(),
  new ArticlesRepository(),
  serverSettingsService,
);
const uploadImagesService = new UploadImagesService(
  new UploadImagesRepository(),
);
const tagsService = new TagsService(new TagsRepository());
const usersCtrl = new UsersController(
  usersService,
  tagsService,
  uploadImagesService,
);
const userWebhookCtrl = new UserWebhookController(
  userWebhookService,
  webhookPreviewService,
);

const attachRefreshExpiryHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  const now = Date.now();
  res.setHeader(
    "X-Access-Token-Expires-At",
    new Date(now + ACCESS_TOKEN_MAX_AGE_MS).toISOString(),
  );
  res.setHeader(
    "X-Refresh-Token-Expires-At",
    new Date(now + REFRESH_TOKEN_MAX_AGE_MS).toISOString(),
  );
  next();
};

usersRouter.get("/users", requireSiteAuthentication, usersCtrl.getUsers);
usersRouter.get("/users/id/:userId", requireSiteAuthentication, usersCtrl.getUserById);
usersRouter.get("/users/:username", requireSiteAuthentication, usersCtrl.getUserByUsername);
usersRouter.get("/me", authenticateToken, usersCtrl.getMe);
usersRouter.post("/register", usersCtrl.registerUser);
usersRouter.post("/refresh", attachRefreshExpiryHeaders, usersCtrl.refreshToken);
usersRouter.post("/logout", usersCtrl.logoutUser);
usersRouter.get("/devices", authenticateToken, usersCtrl.getDevices);
usersRouter.post("/logout/all", authenticateToken, usersCtrl.logoutAllDevices);
usersRouter.post("/logout/device/:sessionId", authenticateToken, usersCtrl.logoutDevice);
usersRouter.put("/users/:userId/password", usersCtrl.changePassword);
usersRouter.put("/users/update/info", authenticateToken, usersCtrl.updateUserInfo);
usersRouter.put("/users/update/username", authenticateToken, usersCtrl.updateUsername);
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
