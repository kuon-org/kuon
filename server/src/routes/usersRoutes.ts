import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { UsersService } from "../services/usersService.js";
import { UsersController } from "../controllers/usersController.js";
import { UploadImagesRepository } from "../repositories/uploadImagesRepository.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { TagsRepository } from "../repositories/tagsRepository.js";
import { TagsService } from "../services/tagsService.js";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { serverSettingsService } from "../services/serverSettingsService.js";

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

usersRouter.get("/users", usersCtrl.getUsers);
usersRouter.get("/users/id/:userId", usersCtrl.getUserById);
usersRouter.get("/users/:username", usersCtrl.getUserByUsername);
usersRouter.get("/me", authenticateToken, usersCtrl.getMe);
usersRouter.post("/register", usersCtrl.registerUser);

usersRouter.post("/refresh", usersCtrl.refreshToken);
usersRouter.post("/logout", usersCtrl.logoutUser);
usersRouter.get("/devices", authenticateToken, usersCtrl.getDevices);
usersRouter.post("/logout/all", authenticateToken, usersCtrl.logoutAllDevices);
usersRouter.post(
  "/logout/device/:sessionId",
  authenticateToken,
  usersCtrl.logoutDevice,
);

usersRouter.put("/users/:userId/password", usersCtrl.changePassword);
usersRouter.put(
  "/users/update/info",
  authenticateToken,
  usersCtrl.updateUserInfo,
);
usersRouter.put(
  "/users/update/username",
  authenticateToken,
  usersCtrl.updateUsername,
);

usersRouter.post("/users/follow", authenticateToken, usersCtrl.toggleFollow);
usersRouter.get(
  "/users/:followeeId/isfollowing",
  authenticateToken,
  usersCtrl.isFollowing,
);
usersRouter.get("/users/:userId/follower", usersCtrl.getFollowers);
usersRouter.get("/users/:userId/follow", usersCtrl.getFollowings);

usersRouter.get(
  "/users/settings/uploaded_images",
  authenticateToken,
  usersCtrl.getUploadedImages,
);
usersRouter.get(
  "/users/settings/idpinfo",
  authenticateToken,
  usersCtrl.getUserIdentities,
);
usersRouter.post(
  "/users/settings/upload_avatar",
  authenticateToken,
  usersCtrl.uploadLocalAvatar,
);

usersRouter.get("/users/:userId/following_tags", usersCtrl.getFollowingTags);
usersRouter.get(
  "/users/tags/me",
  authenticateToken,
  usersCtrl.getMyFollowingtags,
);

usersRouter.get("/users/:userId/pickup", usersCtrl.getPickupArticles);
usersRouter.post(
  "/users/pickup/create",
  authenticateToken,
  usersCtrl.createPickupArticle,
);
usersRouter.post(
  "/users/pickup/delete",
  authenticateToken,
  usersCtrl.deletePickupArticle,
);

usersRouter.get("/users/:userId/comments", usersCtrl.getCommentCount);
usersRouter.get("/users/:userId/articles", usersCtrl.getArticleCount);
usersRouter.get("/users/ranking/all", usersCtrl.getAllRanking);

usersRouter.get(
  "/users/settings/api-keys",
  authenticateToken,
  usersCtrl.getApiKeys,
);
usersRouter.post(
  "/users/settings/api-keys",
  authenticateToken,
  usersCtrl.createApiKey,
);
usersRouter.delete(
  "/users/settings/api-keys/:apiKeyId",
  authenticateToken,
  usersCtrl.revokeApiKey,
);

export default usersRouter;
