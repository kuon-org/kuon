import { Router } from "express";
import { TagsController } from "../controllers/tagsController.js";
import { TagsRepository } from "../repositories/tagsRepository.js";
import { TagsService } from "../services/tagsService.js";
import { authenticateToken } from "../middlewares/auth.js";

const tagsRouter = Router();

const tagsRepo = new TagsRepository();
const tagsService = new TagsService(tagsRepo);
const tagsController = new TagsController(tagsService);

// タグ一覧取得
tagsRouter.get("/tags", tagsController.getTags);

tagsRouter.get("/tags/:slug", tagsController.getTag);

// タグの保存・更新（POST /api/tags）
tagsRouter.post("/tags", authenticateToken, tagsController.upsertTag);

tagsRouter.get(
  "/tags/:slug/isFollowing",
  authenticateToken,
  tagsController.getIsFollowing,
);

tagsRouter.post(
  "/tags/:slug/follow",
  authenticateToken,
  tagsController.toggleFollowing,
);

tagsRouter.post(
  "/tags/:slug/upload_avatar",
  authenticateToken,
  tagsController.uploadTagAvatar,
);

export default tagsRouter;
