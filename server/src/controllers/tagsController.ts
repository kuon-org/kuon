import { Request, Response } from "express";
import { TagsService } from "../services/tagsService.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import { permissionService } from "../services/permissionService.js";
import { Permissions } from "../constants/permissions.js";
import { AppError, ValidationError } from "../errors/AppError.js";

export class TagsController {
  constructor(private tagsService: TagsService) {}

  getTags = async (_req: Request, res: Response) => {
    try {
      const tags = await this.tagsService.getTagList();
      res.json(tags);
    } catch (error) {
      console.error("Tag list fetch failed", error);
      throw new AppError(500, "TAG_LIST_FETCH_FAILED", "Failed to fetch tags");
    }
  };

  getTag = async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    try {
      const tag = await this.tagsService.getTag(slug);
      res.json(tag);
    } catch (error) {
      console.error("Tag fetch failed", error);
      throw new AppError(500, "TAG_FETCH_FAILED", "Failed to fetch tag");
    }
  };

  upsertTag = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    const { name, slug, description, avatar_url } = req.body;
    const normalizedSlug = typeof slug === "string" ? slug.trim() : "";
    const fields: Record<string, string[]> = {};
    if (typeof name !== "string" || !name.trim()) fields.name = ["TAG_NAME_REQUIRED"];
    if (!normalizedSlug) fields.slug = ["TAG_SLUG_REQUIRED"];
    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    try {
      const existingTag = await this.tagsService.getTag(normalizedSlug);
      const requiredPermission = existingTag
        ? Permissions.Tag.Manage
        : Permissions.Tag.Create;

      const hasRequiredPermission = await permissionService.hasPermission(
        req.user.userId,
        requiredPermission,
      );
      const canManage =
        !existingTag &&
        (await permissionService.hasPermission(
          req.user.userId,
          Permissions.Tag.Manage,
        ));

      if (!hasRequiredPermission && !canManage) {
        throw new AppError(
          403,
          "PERMISSION_DENIED",
          "Permission denied",
          { permission: requiredPermission },
        );
      }

      const tagData = {
        name,
        slug: normalizedSlug,
        description,
        avatar_url,
      };
      const result = existingTag
        ? await this.tagsService.updateTag(tagData)
        : await this.tagsService.createTag(tagData);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Tag save failed", error);
      throw new AppError(400, "TAG_SAVE_FAILED", "Failed to save tag");
    }
  };

  uploadTagAvatar = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
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
      if (err) {
        return res.status(500).json({
          error: {
            code: "TAG_AVATAR_UPLOAD_FAILED",
            message: "Tag avatar upload failed",
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
      const pathname = `/uploads/tags/${req.file.filename}`;
      return res.status(200).json({ url: pathname });
    });
  };

  getIsFollowing = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    try {
      const isFollow = await this.tagsService.getIsFollowing(
        req.user.userId,
        String(req.params.slug),
      );
      res.json({ isFollow });
    } catch (error) {
      console.error("Tag follow status fetch failed", error);
      throw new AppError(500, "TAG_FOLLOW_STATUS_FETCH_FAILED", "Failed to fetch tag follow status");
    }
  };

  toggleFollowing = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    try {
      const result = await this.tagsService.toggleFollowing(
        req.user.userId,
        String(req.params.slug),
      );
      res.json(result);
    } catch (error) {
      console.error("Tag follow toggle failed", error);
      throw new AppError(500, "TAG_FOLLOW_UPDATE_FAILED", "Failed to update tag follow state");
    }
  };
}
