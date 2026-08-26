import type { NextFunction, Response } from "express";
import prisma from "../prisma/client.js";
import type { PermissionKey } from "../constants/permissions.js";
import { permissionService } from "../services/permissionService.js";
import { AuthRequest, isAuthenticated } from "./auth.js";

const deny = (res: Response, permission: PermissionKey) =>
  res.status(403).json({
    code: "PERMISSION_DENIED",
    message: "この操作を実行する権限がありません",
    permission,
  });

export const requireArticlePermission = (
  ownPermission: PermissionKey,
  anyPermission: PermissionKey,
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    try {
      const permissions = new Set(
        await permissionService.getUserPermissions(req.user.userId),
      );
      if (permissions.has(anyPermission)) return next();
      if (!permissions.has(ownPermission)) return deny(res, ownPermission);

      const articleId = String(req.params.articleId);
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: { user_id: true },
      });
      if (!article) return res.status(404).json({ message: "記事が見つかりません" });
      if (article.user_id !== req.user.userId) return deny(res, ownPermission);
      return next();
    } catch (error) {
      console.error("Article permission check failed", error);
      return res.status(500).json({ message: "権限の確認に失敗しました" });
    }
  };
};

export const requireCommentPermission = (
  ownPermission: PermissionKey,
  anyPermission: PermissionKey,
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    try {
      const permissions = new Set(
        await permissionService.getUserPermissions(req.user.userId),
      );
      if (permissions.has(anyPermission)) return next();
      if (!permissions.has(ownPermission)) return deny(res, ownPermission);

      const commentId = String(req.params.commentId);
      const comment = await prisma.comments.findUnique({
        where: { id: commentId },
        select: { user_id: true },
      });
      if (!comment) return res.status(404).json({ message: "コメントが見つかりません" });
      if (comment.user_id !== req.user.userId) return deny(res, ownPermission);
      return next();
    } catch (error) {
      console.error("Comment permission check failed", error);
      return res.status(500).json({ message: "権限の確認に失敗しました" });
    }
  };
};
