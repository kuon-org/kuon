import { Request, Response } from 'express';
import * as articlesService from '../services/articlesService.js';
import * as uploadImagesService from '../services/uploadImagesService.js';
import { AuthRequest, isAuthenticated } from '../middlewares/auth.js';
import multer from "multer";
import path from "path";
import fs from "fs";
import { uuidv7 } from "../utils/uuid/index.js";


export const getArticles = async (req: Request, res: Response) => {
  try {
    const articles = await articlesService.getPublishedArticleList();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
  }
}


export const getArticlesByUserId = async (req: Request, res: Response) => {
  try {

    if(!isAuthenticated(req)) {
      return res.status(401).json({message: "未ログインです"});
    }
    const articles = await articlesService.getAllArticlesByUserId(req.user.userId);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
  }
}

export const getArticle = async (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);
  try {
    const article = await articlesService.getArticle(articleId);
    res.json(article);
  } catch (error: any) {
    if (error.message === "ArticleNotFound") {
      return res.status(404).json({ message: "記事が見つかりません" });
    }
    res.status(500).json({ message: error.message || "エラーが発生しました" });
  }
};

export const getArticleMarkdown = async (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);
  try {
    const article = await articlesService.getArticle(articleId);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(article.raw_content)
  } catch (error: any) {
    if (error.message === "ArticleNotFound") {
      return res.status(404).json({ message: "記事が見つかりません" });
    }
    res.status(500).json({ message: error.message || "エラーが発生しました" });
  }
}

export const getArticleIsOwned = async (req: AuthRequest, res: Response) => {
  const articleId = String(req.params.articleId);
  try {
    if(!isAuthenticated(req)) {
      return res.status(401).json({message: "未ログインです"});
    }

    const isOwned = await articlesService.getIsOwned(articleId, req.user.userId);
    res.json({ isOwned: isOwned })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
  }
}

export const getArticleLikeUserByArticleId = async (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);
  try {
    const like_detail = await articlesService.getArticleLikeUserWithCount(articleId);
    res.json(like_detail);

  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
  }
}

export const getIsLiked = async (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);
  try {
    if(!isAuthenticated(req)) {
      return res.status(401).json({message: "未ログインです"});
    }
    const isLike = await articlesService.getIsLiked(articleId, req.user.userId);
    res.json({ isLike: isLike });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
  }
}

export const toggleLike = async (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);

  try {
    if(!isAuthenticated(req)) {
      return res.status(401).json({message: "未ログインです"});
    }
    const result = await articlesService.toggleLike(articleId, req.user.userId);
    res.json(result);

  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'エラーが発生しました',
    });
  }
};


/**
 * 記事を新規作成する
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    if(!isAuthenticated(req)) {
      return res.status(401).json({message: "未ログインです"});
    }

    const { title, content, summary, isPublished } = req.body;
    console.log(req.user.userId)
    const newArticle = await articlesService.createArticle(req.user.userId, {
      title,
      content,
      summary,
      isPublished
    });

    res.status(201).json(newArticle);
  } catch (error: any) {
    if (error.message === "TitleRequired" || error.message === "ContentRequired") {
      return res.status(400).json({ message: "タイトルと本文は必須です" });
    }
    res.status(500).json({ message: error.message || "作成中にエラーが発生しました" });
  }
};

/**
 * 記事を更新する
 */
export const updateArticle = async (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);
  try {
    if(!isAuthenticated(req)) {
      return res.status(401).json({message: "未ログインです"});
    }
    const { title, content, isPublished } = req.body;

    const updated = await articlesService.updateArticle(articleId, req.user.userId, {
      title,
      content,
      isPublished
    });

    res.json(updated);
  } catch (error: any) {
    if (error.message === "ArticleNotFound") {
      return res.status(404).json({ message: "記事が見つかりません" });
    }
    if (error.message === "Forbidden") {
      return res.status(403).json({ message: "この記事を編集する権限がありません" });
    }
    res.status(500).json({ message: error.message || "更新中にエラーが発生しました" });
  }
};

/**
 * 記事画像をアップロードする
 */
export const uploadArticleImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }

    const userId = req.user.userId;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // 1. 画像ID（UUID）を先に生成
    const imageId = uuidv7();

    // 2. multerの設定（imageIdをファイル名に利用）
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${imageId}${ext}`); // 例: "018db2a5-xxxx.png"
      },
    });

    const upload = multer({ storage }).single("image");

    // 3. アップロード処理の実行
    upload(req, res, async (err: any) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "アップロードに失敗しました" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "ファイルがありません" });
      }

      try {
        // 4. DBに情報を登録（ここでサービス層の registerImage を呼び出す）
        await uploadImagesService.registerImage(
          imageId,
          userId,
          req.file,
          "article"
        );

        // 5. 画像ID（拡張子付きファイル名）だけでアクセスできるURLを返す
        const imageUrl = `/uploads/${req.file.filename}`;
        return res.status(200).json({ url: imageUrl });

      } catch (dbError) {
        console.error("Database registration error:", dbError);
        // DB登録に失敗した場合は、保存された物理ファイルを削除するなどのクリーンアップが望ましい
        res.status(500).json({ message: "DB登録中にエラーが発生しました" });
      }
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message ?? "アップロード中にエラーが発生しました" });
  }
};