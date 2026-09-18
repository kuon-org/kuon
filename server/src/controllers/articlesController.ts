import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { AppError, ValidationError } from "../errors/AppError.js";
import { uuidv7 } from "../utils/uuid/index.js";
import { ArticlesService } from "../services/articlesService.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { getFileStorage } from "../storage/storageFactory.js";

export class ArticlesController {
  constructor(
    private articlesService: ArticlesService,
    private uploadImagesService: UploadImagesService,
  ) {}

  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  private mapArticleError(error: unknown, fallbackCode: string, fallbackMessage: string) {
    if (error instanceof AppError) return error;
    const message = error instanceof Error ? error.message : "";
    switch (message) {
      case "ArticleNotFound":
        return new AppError(404, "ARTICLE_NOT_FOUND", "Article not found");
      case "Forbidden":
      case "Unauthorized":
      case "Unauthorized or Not Found":
        return new AppError(403, "ARTICLE_ACCESS_DENIED", "Article access denied");
      case "No published version to rollback to":
        return new AppError(404, "ARTICLE_PUBLISHED_VERSION_NOT_FOUND", "Published article version not found");
      case "TitleRequired":
        return new ValidationError({ title: ["ARTICLE_TITLE_REQUIRED"] });
      case "InvalidGroupId":
        return new ValidationError({ group_id: ["ARTICLE_GROUP_ID_INVALID"] });
      case "GroupMembershipRequired":
        return new AppError(403, "ARTICLE_GROUP_MEMBERSHIP_REQUIRED", "Group membership required");
      case "GroupRequiredForMembersVisibility":
        return new ValidationError({ group_id: ["ARTICLE_GROUP_REQUIRED_FOR_MEMBERS_VISIBILITY"] });
      default:
        console.error(fallbackMessage, error);
        return new AppError(500, fallbackCode, fallbackMessage);
    }
  }

  getArticles = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
      const q = req.query.q as string;
      res.json(await this.articlesService.getPublishedArticleList(page, limit, q));
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_LIST_FETCH_FAILED", "Failed to fetch articles");
    }
  };

  getTrendingArticles = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
      const weights = {
        like: req.query.like ? parseFloat(req.query.like as string) : undefined,
        view: req.query.view ? parseFloat(req.query.view as string) : undefined,
        stock: req.query.stock ? parseFloat(req.query.stock as string) : undefined,
        comment: req.query.comment ? parseFloat(req.query.comment as string) : undefined,
      };
      res.json(await this.articlesService.getTrendingArticleList(page, limit, weights));
    } catch (error) {
      throw this.mapArticleError(error, "TRENDING_ARTICLES_FETCH_FAILED", "Failed to fetch trending articles");
    }
  };

  getRecommendArticles = async (req: AuthRequest, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
      const userId = req.user?.userId ?? null;
      res.status(200).json(
        await this.articlesService.getRecommendArticleList(userId, page, limit),
      );
    } catch (error) {
      throw this.mapArticleError(error, "RECOMMENDED_ARTICLES_FETCH_FAILED", "Failed to fetch recommended articles");
    }
  };

  getAllArticlesByUserId = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.articlesService.getAllArticlesByUserId(user.userId));
    } catch (error) {
      throw this.mapArticleError(error, "USER_ARTICLES_FETCH_FAILED", "Failed to fetch user articles");
    }
  };

  getArticlesByUserId = async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
      const q = req.query.q as string;
      res.json(await this.articlesService.getArticlesByUserId(userId, page, limit, q));
    } catch (error) {
      throw this.mapArticleError(error, "USER_ARTICLES_FETCH_FAILED", "Failed to fetch user articles");
    }
  };

  getArticle = async (req: AuthRequest, res: Response) => {
    try {
      res.json(
        await this.articlesService.getArticle(
          String(req.params.articleId),
          req.user?.userId,
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_FETCH_FAILED", "Failed to fetch article");
    }
  };

  getArticleMarkdown = async (req: AuthRequest, res: Response) => {
    try {
      const article = await this.articlesService.getArticle(
        String(req.params.articleId),
        req.user?.userId,
      );
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.send(article.raw_content);
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_MARKDOWN_FETCH_FAILED", "Failed to fetch article markdown");
    }
  };

  getArticleIsOwned = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const owned = await this.articlesService.getIsOwned(
        String(req.params.articleId),
        user.userId,
      );
      res.json({ isOwned: owned });
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_OWNERSHIP_FETCH_FAILED", "Failed to fetch article ownership");
    }
  };

  getArticleLikeUserByArticleId = async (req: AuthRequest, res: Response) => {
    try {
      res.json(
        await this.articlesService.getArticleLikeUserWithCount(
          String(req.params.articleId),
          req.user?.userId,
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_LIKES_FETCH_FAILED", "Failed to fetch article likes");
    }
  };

  getIsLiked = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const isLike = await this.articlesService.getIsLiked(
        String(req.params.articleId),
        user.userId,
      );
      res.json({ isLike });
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_LIKE_STATE_FETCH_FAILED", "Failed to fetch article like state");
    }
  };

  toggleLike = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.articlesService.toggleLike(
          String(req.params.articleId),
          user.userId,
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_LIKE_UPDATE_FAILED", "Failed to update article like state");
    }
  };

  createArticle = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.status(201).json(await this.articlesService.createArticle(user.userId, req.body));
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_CREATE_FAILED", "Failed to create article");
    }
  };

  updateArticle = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.articlesService.updateArticle(
          String(req.params.articleId),
          user.userId,
          req.body,
          req.authorization?.resourceScope === "any",
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_UPDATE_FAILED", "Failed to update article");
    }
  };

  rollBackDraft = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.articlesService.rollbackDraft(
          String(req.params.articleId),
          user.userId,
          req.authorization?.resourceScope === "any",
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_ROLLBACK_FAILED", "Failed to rollback article draft");
    }
  };

  deleteArticle = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      await this.articlesService.deleteArticle(
        String(req.params.articleId),
        user.userId,
        req.authorization?.resourceScope === "any",
      );
      res.json({ message: "記事を削除しました" });
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_DELETE_FAILED", "Failed to delete article");
    }
  };

  getDeletedArticlesByUserId = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.articlesService.getTrashArticles(user.userId));
    } catch (error) {
      throw this.mapArticleError(error, "TRASH_ARTICLES_FETCH_FAILED", "Failed to fetch deleted articles");
    }
  };

  restoreArticle = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.articlesService.restoreArticle(
          String(req.params.articleId),
          user.userId,
          req.authorization?.resourceScope === "any",
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_RESTORE_FAILED", "Failed to restore article");
    }
  };

  hardDeleteArticle = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.articlesService.hardDeleteArticle(
          String(req.params.articleId),
          user.userId,
          req.authorization?.resourceScope === "any",
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_HARD_DELETE_FAILED", "Failed to permanently delete article");
    }
  };

  uploadArticleImage = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const userId = user.userId;
    const imageId = uuidv7();
    const upload = multer({ storage: multer.memoryStorage() }).single("image");

    upload(req, res, async (error: any) => {
      if (error) {
        return res.status(500).json({
          error: {
            code: "ARTICLE_IMAGE_UPLOAD_FAILED",
            message: "Article image upload failed",
            details: null,
          },
        });
      }
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: { fields: { image: ["IMAGE_REQUIRED"] } },
          },
        });
      }

      const ext = path.extname(req.file.originalname);
      const key = `${imageId}${ext}`;
      const fileStorage = getFileStorage();

      try {
        await fileStorage.put({
          key,
          body: req.file.buffer,
          contentType: req.file.mimetype,
        });
        await this.uploadImagesService.registerImage(
          imageId,
          userId,
          req.file,
          "article",
        );
        return res.status(200).json({ url: `/uploads/${key}` });
      } catch (dbError) {
        try {
          await fileStorage.delete(key);
        } catch (cleanupError) {
          console.error("Article image cleanup failed", cleanupError);
        }
        console.error("Article image registration failed", dbError);
        return res.status(500).json({
          error: {
            code: "ARTICLE_IMAGE_REGISTER_FAILED",
            message: "Article image registration failed",
            details: null,
          },
        });
      }
    });
  };

  getArticleMarp = async (req: AuthRequest, res: Response) => {
    try {
      res.json(
        await this.articlesService.getArticleMarp(
          String(req.params.articleId),
          req.user?.userId,
        ),
      );
    } catch (error) {
      throw this.mapArticleError(error, "ARTICLE_MARP_FETCH_FAILED", "Failed to fetch article Marp data");
    }
  };
}
