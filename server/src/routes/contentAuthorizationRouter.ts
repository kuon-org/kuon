import { Router } from "express";
import { Permissions } from "../constants/permissions.js";
import { authenticateToken } from "../middlewares/auth.js";
import { requirePermission } from "../middlewares/permission.js";
import {
  requireArticlePermission,
  requireCommentPermission,
} from "../middlewares/resourcePermission.js";

const contentAuthorizationRouter = Router();

// Creation capabilities.
contentAuthorizationRouter.post(
  "/articles/create",
  authenticateToken,
  requirePermission(Permissions.Article.Create),
);
contentAuthorizationRouter.post(
  "/articles/upload",
  authenticateToken,
  requirePermission(Permissions.Article.Create),
);
contentAuthorizationRouter.post(
  "/articles/:articleId/comments",
  authenticateToken,
  requirePermission(Permissions.Comment.Create),
);

// Article ownership-aware capabilities.
contentAuthorizationRouter.patch(
  "/articles/:articleId/edit",
  authenticateToken,
  requireArticlePermission(
    Permissions.Article.UpdateOwn,
    Permissions.Article.UpdateAny,
  ),
);
contentAuthorizationRouter.post(
  "/articles/:articleId/rollback",
  authenticateToken,
  requireArticlePermission(
    Permissions.Article.UpdateOwn,
    Permissions.Article.UpdateAny,
  ),
);
contentAuthorizationRouter.delete(
  "/articles/:articleId",
  authenticateToken,
  requireArticlePermission(
    Permissions.Article.DeleteOwn,
    Permissions.Article.DeleteAny,
  ),
);
contentAuthorizationRouter.post(
  "/articles/:articleId/restore",
  authenticateToken,
  requireArticlePermission(
    Permissions.Article.DeleteOwn,
    Permissions.Article.DeleteAny,
  ),
);
contentAuthorizationRouter.delete(
  "/articles/:articleId/hard",
  authenticateToken,
  requireArticlePermission(
    Permissions.Article.DeleteOwn,
    Permissions.Article.DeleteAny,
  ),
);

// Comment ownership-aware capabilities.
contentAuthorizationRouter.delete(
  "/articles/:articleId/comments/:commentId",
  authenticateToken,
  requireCommentPermission(
    Permissions.Comment.DeleteOwn,
    Permissions.Comment.DeleteAny,
  ),
);

export default contentAuthorizationRouter;
