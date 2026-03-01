import multer from "multer";
import path from "path";
import fs from "fs";
import { uuidv7 } from "../utils/uuid/index.js";
import { isAuthenticated } from "../middlewares/auth.js";
export class ArticlesController {
    constructor(articlesService, uploadImagesService) {
        this.articlesService = articlesService;
        this.uploadImagesService = uploadImagesService;
        // ExpressのRouterでコールバックとして渡すため、メソッドはアロー関数で定義して `this` を固定する
        this.getArticles = async (req, res) => {
            try {
                const page = Math.max(1, parseInt(req.query.page) || 1);
                const limit = Math.min(50, parseInt(req.query.limit) || 10);
                const q = req.query.q; // 検索クエリ文字列を取得
                const result = await this.articlesService.getPublishedArticleList(page, limit, q);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getArticlesByUserId = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const articles = await this.articlesService.getAllArticlesByUserId(req.user.userId);
                res.json(articles);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getArticle = async (req, res) => {
            try {
                const userId = req.user?.userId;
                const article = await this.articlesService.getArticle(String(req.params.articleId), userId);
                res.json(article);
            }
            catch (error) {
                let status = 500;
                if (error.message === "ArticleNotFound")
                    status = 404;
                if (error.message === "Forbidden")
                    status = 403;
                res.status(status).json({ message: error.message });
            }
        };
        this.getArticleMarkdown = async (req, res) => {
            try {
                const userId = req.user?.userId;
                const article = await this.articlesService.getArticle(String(req.params.articleId), userId);
                res.setHeader("Content-Type", "text/markdown; charset=utf-8");
                res.send(article.raw_content);
            }
            catch (error) {
                res
                    .status(error.message === "ArticleNotFound" ? 404 : 500)
                    .json({ message: error.message });
            }
        };
        this.getArticleIsOwned = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const owned = await this.articlesService.getIsOwned(String(req.params.articleId), req.user.userId);
                res.json({ isOwned: owned });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getArticleLikeUserByArticleId = async (req, res) => {
            try {
                const detail = await this.articlesService.getArticleLikeUserWithCount(String(req.params.articleId));
                res.json(detail);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getIsLiked = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const isLike = await this.articlesService.getIsLiked(String(req.params.articleId), req.user.userId);
                res.json({ isLike });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.toggleLike = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const result = await this.articlesService.toggleLike(String(req.params.articleId), req.user.userId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.createArticle = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const newArticle = await this.articlesService.createArticle(req.user.userId, req.body);
                res.status(201).json(newArticle);
            }
            catch (error) {
                const status = error.message === "TitleRequired" ? 400 : 500;
                res.status(status).json({ message: error.message });
            }
        };
        this.updateArticle = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const updated = await this.articlesService.updateArticle(String(req.params.articleId), req.user.userId, req.body);
                res.json(updated);
            }
            catch (error) {
                let status = 500;
                if (error.message === "ArticleNotFound")
                    status = 404;
                if (error.message === "Forbidden")
                    status = 403;
                res.status(status).json({ message: error.message });
            }
        };
        this.rollBackDraft = async (req, res) => {
            const articleId = String(req.params.articleId);
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const userId = req.user.userId;
                const rollback = await this.articlesService.rollbackDraft(articleId, userId);
                res.json(rollback);
            }
            catch (error) {
                let status = 500;
                if (error.message === "Unauthorized or Not Found")
                    status === 401;
                if (error.message === "No published version to rollback to")
                    status === 404;
                res.status(status).json({ message: error.message });
            }
        };
        this.deleteArticle = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const articleId = String(req.params.articleId);
                const userId = req.user.userId;
                await this.articlesService.deleteArticle(articleId, userId);
                res.json({ message: "記事を削除しました" });
            }
            catch (error) {
                let status = 500;
                if (error.message === "Unauthorized or Not Found")
                    status = 403;
                res.status(status).json({ message: error.message });
            }
        };
        this.getDeletedArticlesByUserId = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const articles = await this.articlesService.getTrashArticles(req.user.userId);
                res.json(articles);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.restoreArticle = async (req, res) => {
            try {
                const articleId = String(req.params.articleId);
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const restored = await this.articlesService.restoreArticle(articleId, req.user.userId);
                res.json(restored);
            }
            catch (error) {
                let status = 500;
                if (error.message === "Unauthorized or Not Found")
                    status = 403;
                res.status(status).json({ message: error.message });
            }
        };
        this.hardDeleteArticle = async (req, res) => {
            try {
                const articleId = String(req.params.articleId);
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const hardDeleted = await this.articlesService.hardDeleteArticle(articleId, req.user.userId);
                res.json(hardDeleted);
            }
            catch (error) {
                let status = 500;
                if (error.message === "Unauthorized or Not Found")
                    status = 403;
                res.status(status).json({ message: error.message });
            }
        };
        this.uploadArticleImage = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            const userId = req.user.userId;
            const uploadDir = path.join(process.cwd(), "public/uploads");
            if (!fs.existsSync(uploadDir))
                fs.mkdirSync(uploadDir, { recursive: true });
            const imageId = uuidv7();
            const storage = multer.diskStorage({
                destination: (_req, _file, cb) => cb(null, uploadDir),
                filename: (_req, file, cb) => cb(null, `${imageId}${path.extname(file.originalname)}`),
            });
            const upload = multer({ storage }).single("image");
            upload(req, res, async (err) => {
                if (err || !req.file)
                    return res.status(500).json({ message: "アップロード失敗" });
                try {
                    await this.uploadImagesService.registerImage(imageId, userId, req.file, "article");
                    res.status(200).json({ url: `/uploads/${req.file.filename}` });
                }
                catch (dbError) {
                    res.status(500).json({ message: "DB登録エラー" });
                }
            });
        };
    }
}
