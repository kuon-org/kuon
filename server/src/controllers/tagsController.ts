import { Request, Response } from "express";
import { TagsService } from "../services/tagsService.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import path from "path";
import fs from "fs";
import multer from "multer";
export class TagsController {
  constructor(private tagsService: TagsService) {}

  getTags = async (req: Request, res: Response) => {
    try {
      const tags = await this.tagsService.getTagList();
      res.json(tags);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getTag = async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    try {
      const tag = await this.tagsService.getTag(slug);
      res.json(tag);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  // 保存用メソッドを追加
  upsertTag = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const { name, slug, description, avatar_url } = req.body;
      const result = await this.tagsService.saveTag({
        name,
        slug,
        description,
        avatar_url,
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "タグの保存に失敗しました",
      });
    }
  };

  uploadTagAvatar = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "未ログインです" });
    }
    const slug = String(req.params.slug);
    const uploadDir = path.join(process.cwd(), "public/uploads/tags");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    let filename;
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        filename = `${file.originalname}_tag${ext}`;
        cb(null, filename);
      },
    });
    const upload = multer({ storage }).single("image");

    upload(req, res, async (err: any) => {
      if (err)
        return res.status(500).json({ message: "アップロードに失敗しました" });
      if (!req.file)
        return res.status(400).json({ message: "ファイルがありません" });
      const pathname = `/uploads/tags/${req.file.filename}`;
      try {
        res.status(200).json({ url: pathname });
      } catch {
        res.status(500).json({ message: "ファイルアップロードエラー" });
      }
    });
  };

  getIsFollowing = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const isFollow = await this.tagsService.getIsFollowing(
        req.user.userId,
        String(req.params.slug),
      );
      res.json({ isFollow });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  toggleFollowing = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const result = await this.tagsService.toggleFollowing(
        req.user.userId,
        String(req.params.slug),
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
