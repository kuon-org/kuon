import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uuidv7 } from "../utils/uuid/index.js";
import { ArticlesService } from "../services/articlesService.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";

export class ArticlesController {
  constructor(
    private articlesService: ArticlesService,
    private uploadImagesService: UploadImagesService,
  ) {}

  // ExpressのRouterでコールバックとして渡すため、メソッドはアロー関数で定義して `this` を固定する
  getArticles = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
      const q = req.query.q as string; // 検索クエリ文字列を取得

      const result = await this.articlesService.getPublishedArticleList(
        page,
        limit,
        q,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
  getTrendingArticles = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

      // スライダー等の比重設定を取得
      const weights = {
        like: req.query.like ? parseFloat(req.query.like as string) : undefined,
        view: req.query.view ? parseFloat(req.query.view as string) : undefined,
        stock: req.query.stock
          ? parseFloat(req.query.stock as string)
          : undefined,
        comment: req.query.comment
          ? parseFloat(req.query.comment as string)
          : undefined,
      };

      const result = await this.articlesService.getTrendingArticleList(
        page,
        limit,
        weights,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
  getArticlesByUserId = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const articles = await this.articlesService.getAllArticlesByUserId(
        req.user.userId,
      );
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getArticle = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const article = await this.articlesService.getArticle(
        String(req.params.articleId),
        userId,
      );
      res.json(article);
    } catch (error: any) {
      let status = 500;
      if (error.message === "ArticleNotFound") status = 404;
      if (error.message === "Forbidden") status = 403;
      res.status(status).json({ message: error.message });
    }
  };

  getArticleMarkdown = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const article = await this.articlesService.getArticle(
        String(req.params.articleId),
        userId,
      );
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.send(article.raw_content);
    } catch (error: any) {
      res
        .status(error.message === "ArticleNotFound" ? 404 : 500)
        .json({ message: error.message });
    }
  };

  getArticleIsOwned = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const owned = await this.articlesService.getIsOwned(
        String(req.params.articleId),
        req.user.userId,
      );
      res.json({ isOwned: owned });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getArticleLikeUserByArticleId = async (req: Request, res: Response) => {
    try {
      const detail = await this.articlesService.getArticleLikeUserWithCount(
        String(req.params.articleId),
      );
      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getIsLiked = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const isLike = await this.articlesService.getIsLiked(
        String(req.params.articleId),
        req.user.userId,
      );
      res.json({ isLike });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  toggleLike = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const result = await this.articlesService.toggleLike(
        String(req.params.articleId),
        req.user.userId,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  createArticle = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const newArticle = await this.articlesService.createArticle(
        req.user.userId,
        req.body,
      );
      res.status(201).json(newArticle);
    } catch (error: any) {
      const status = error.message === "TitleRequired" ? 400 : 500;
      res.status(status).json({ message: error.message });
    }
  };

  updateArticle = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const updated = await this.articlesService.updateArticle(
        String(req.params.articleId),
        req.user.userId,
        req.body,
      );
      res.json(updated);
    } catch (error: any) {
      let status = 500;
      if (error.message === "ArticleNotFound") status = 404;
      if (error.message === "Forbidden") status = 403;
      res.status(status).json({ message: error.message });
    }
  };

  rollBackDraft = async (req: AuthRequest, res: Response) => {
    const articleId = String(req.params.articleId);
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const userId = req.user.userId;
      const rollback = await this.articlesService.rollbackDraft(
        articleId,
        userId,
      );
      res.json(rollback);
    } catch (error: any) {
      let status = 500;
      if (error.message === "Unauthorized or Not Found") status === 401;
      if (error.message === "No published version to rollback to")
        status === 404;
      res.status(status).json({ message: error.message });
    }
  };

  deleteArticle = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const articleId = String(req.params.articleId);
      const userId = req.user.userId;

      await this.articlesService.deleteArticle(articleId, userId);
      res.json({ message: "記事を削除しました" });
    } catch (error: any) {
      let status = 500;
      if (error.message === "Unauthorized or Not Found") status = 403;
      res.status(status).json({ message: error.message });
    }
  };

  getDeletedArticlesByUserId = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const articles = await this.articlesService.getTrashArticles(
        req.user.userId,
      );
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  restoreArticle = async (req: AuthRequest, res: Response) => {
    try {
      const articleId = String(req.params.articleId);
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const restored = await this.articlesService.restoreArticle(
        articleId,
        req.user.userId,
      );
      res.json(restored);
    } catch (error: any) {
      let status = 500;
      if (error.message === "Unauthorized or Not Found") status = 403;
      res.status(status).json({ message: error.message });
    }
  };

  hardDeleteArticle = async (req: AuthRequest, res: Response) => {
    try {
      const articleId = String(req.params.articleId);
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const hardDeleted = await this.articlesService.hardDeleteArticle(
        articleId,
        req.user.userId,
      );
      res.json(hardDeleted);
    } catch (error: any) {
      let status = 500;
      if (error.message === "Unauthorized or Not Found") status = 403;
      res.status(status).json({ message: error.message });
    }
  };

  uploadArticleImage = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    const userId = req.user.userId;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const imageId = uuidv7();
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) =>
        cb(null, `${imageId}${path.extname(file.originalname)}`),
    });

    const upload = multer({ storage }).single("image");

    upload(req, res, async (err: any) => {
      if (err || !req.file)
        return res.status(500).json({ message: "アップロード失敗" });

      try {
        await this.uploadImagesService.registerImage(
          imageId,
          userId,
          req.file,
          "article",
        );
        res.status(200).json({ url: `/uploads/${req.file.filename}` });
      } catch (dbError) {
        res.status(500).json({ message: "DB登録エラー" });
      }
    });
  };
}
