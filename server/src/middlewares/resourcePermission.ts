import type { NextFunction, Response } from "express";
import prisma from "../prisma/client.js";
import type { PermissionKey } from "../constants/permissions.js";
import { permissionService } from "../services/permissionService.js";
import { AppError } from "../errors/AppError.js";
import { AuthRequest, isAuthenticated } from "./auth.js";

const permissionDenied = (permission: PermissionKey) =>
  new AppError(403, "PERMISSION_DENIED", "Permission denied", { permission });

export const requireArticlePermission = (
  ownPermission: PermissionKey,
  anyPermission: PermissionKey,
) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return next(
        new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required"),
      );
    }

    try {
      const permissions = new Set(
        await permissionService.getUserPermissions(req.user.userId),
      );
      if (permissions.has(anyPermission)) {
        req.authorization = { resourceScope: "any" };
        return next();
      }
      if (!permissions.has(ownPermission)) return next(permissionDenied(ownPermission));

      const articleId = String(req.params.articleId);
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: { user_id: true },
      });
      if (!article) {
        return next(new AppError(404, "ARTICLE_NOT_FOUND", "Article not found"));
      }
      if (article.user_id !== req.user.userId) {
        return next(permissionDenied(ownPermission));
      }
      req.authorization = { resourceScope: "own" };
      return next();
    } catch (error) {
      if (error instanceof AppError) return next(error);
      console.error("Article permission check failed", error);
      return next(
        new AppError(500, "PERMISSION_CHECK_FAILED", "Permission check failed"),
      );
    }
  };
};

export const requireCommentPermission = (
  ownPermission: PermissionKey,
  anyPermission: PermissionKey,
) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return next(
        new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required"),
      );
    }

    try {
      const permissions = new Set(
        await permissionService.getUserPermissions(req.user.userId),
      );
      if (permissions.has(anyPermission)) {
        req.authorization = { resourceScope: "any" };
        return next();
      }
      if (!permissions.has(ownPermission)) return next(permissionDenied(ownPermission));

      const commentId = String(req.params.commentId);
      const comment = await prisma.comments.findUnique({
        where: { id: commentId },
        select: { user_id: true },
      });
      if (!comment) {
        return next(new AppError(404, "COMMENT_NOT_FOUND", "Comment not found"));
      }
      if (comment.user_id !== req.user.userId) {
        return next(permissionDenied(ownPermission));
      }
      req.authorization = { resourceScope: "own" };
      return next();
    } catch (error) {
      if (error instanceof AppError) return next(error);
      console.error("Comment permission check failed", error);
      return next(
        new AppError(500, "PERMISSION_CHECK_FAILED", "Permission check failed"),
      );
    }
  };
};
