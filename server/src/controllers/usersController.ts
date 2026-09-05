import { Request, Response } from "express";
import { AppError, ValidationError } from "../errors/AppError.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  ACCESS_TOKEN_MAX_AGE_MS,
  getCookieOptions,
} from "../utils/sessionTokens/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UsersService } from "../services/usersService.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { TagsService } from "../services/tagsService.js";
import { totpService } from "../services/totpService.js";

export class UsersController {
  constructor(
    private usersService: UsersService,
    private tagsService: TagsService,
    private uploadImagesService: UploadImagesService,
  ) {}

  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  private internal(code: string, message: string, error: unknown) {
    console.error(message, error);
    return new AppError(500, code, message);
  }

  getMe = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const profile = await this.usersService.getUserById(user.userId);
      const enabled = await totpService.isEnabled(user.userId);
      const role = await this.usersService.getUserRole(user.userId);
      res.json({ ...profile, is_2fa_enabled: enabled, role });
    } catch (error) {
      if (error instanceof Error && error.message === "UserNotFound") {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }
      throw this.internal("USER_FETCH_FAILED", "Failed to fetch current user", error);
    }
  };

  getUsers = async (_req: Request, res: Response) => {
    try {
      res.json(await this.usersService.getAllUsers());
    } catch (error) {
      throw this.internal("USER_LIST_FETCH_FAILED", "Failed to fetch users", error);
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      res.json(await this.usersService.getUserById(String(req.params.userId)));
    } catch (error) {
      if (error instanceof Error && error.message === "UserNotFound") {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }
      throw this.internal("USER_FETCH_FAILED", "Failed to fetch user", error);
    }
  };

  getUserByUsername = async (req: Request, res: Response) => {
    try {
      res.json(await this.usersService.getUserByUsername(String(req.params.username)));
    } catch (error) {
      if (error instanceof Error && error.message === "UserNotFound") {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }
      throw this.internal("USER_FETCH_FAILED", "Failed to fetch user", error);
    }
  };

  registerUser = async (req: Request, res: Response) => {
    const { username, email, password, displayName } = req.body;
    try {
      const result = await this.usersService.registerUser(
        username,
        email,
        password,
        displayName,
      );
      res.status(201).json({ user: result.user, account: result.account });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "UsernameAlreadyExists") {
        throw new AppError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
      }
      if (message === "EmailAlreadyRegistered") {
        throw new AppError(409, "EMAIL_ALREADY_REGISTERED", "Email is already registered");
      }
      throw this.internal("USER_REGISTRATION_FAILED", "User registration failed", error);
    }
  };

  logoutUser = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) await this.usersService.revokeRefreshToken(refreshToken);
    res.clearCookie("access_token", getCookieOptions(0));
    res.clearCookie("refresh_token", getCookieOptions(0));
    res.status(200).json({ message: "ログアウトしました" });
  };

  getDevices = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const sessions = await this.usersService.getUserSessions(user.userId);
      const result = sessions.map(({ refresh_token, ...session }) => ({
        ...session,
        is_current: session.id === user.sessionId,
      }));
      res.json(result);
    } catch (error) {
      throw this.internal("SESSION_LIST_FETCH_FAILED", "Failed to fetch sessions", error);
    }
  };

  logoutAllDevices = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      await this.usersService.deleteAllSessionsByUser(user.userId);
      res.clearCookie("access_token", getCookieOptions(0));
      res.clearCookie("refresh_token", getCookieOptions(0));
      res.json({ message: "すべてのデバイスからログアウトしました" });
    } catch (error) {
      throw this.internal("SESSION_REVOKE_ALL_FAILED", "Failed to revoke all sessions", error);
    }
  };

  logoutDevice = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    const sessionId = String(req.params.sessionId);
    if (!sessionId) throw new ValidationError({ sessionId: ["SESSION_ID_REQUIRED"] });
    try {
      await this.usersService.deleteSessionById(sessionId);
      res.json({ message: "指定されたデバイスからログアウトしました" });
    } catch (error) {
      throw this.internal("SESSION_REVOKE_FAILED", "Failed to revoke session", error);
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      throw new AppError(401, "REFRESH_TOKEN_REQUIRED", "Refresh token is required");
    }

    try {
      const session = await this.usersService.refreshSession(refreshToken);
      res.cookie(
        "access_token",
        session.accessToken,
        getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS),
      );
      res.cookie(
        "refresh_token",
        session.refreshToken,
        getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
      );
      res.json({ message: "トークンを更新しました" });
    } catch {
      res.clearCookie("access_token", getCookieOptions(0));
      res.clearCookie("refresh_token", getCookieOptions(0));
      throw new AppError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid");
    }
  };

  changePassword = async (req: Request, res: Response) => {
    const userId = String(req.params.userId);
    const { currentPass, newPassword } = req.body;
    try {
      const account = await this.usersService.changePassword(userId, currentPass, newPassword);
      res.json({ message: "パスワードを更新しました", accountId: account.id });
    } catch (error) {
      if (error instanceof Error && error.message === "UserNotFound") {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }
      throw this.internal("PASSWORD_CHANGE_FAILED", "Failed to change password", error);
    }
  };

  updateUserInfo = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const { displayName, bio } = req.body;
    try {
      const result = await this.usersService.updateUserInfo(user.userId, displayName, bio);
      return res.status(200).json({ message: "ユーザ情報を更新しました", user: result });
    } catch (error) {
      throw this.internal("USER_PROFILE_UPDATE_FAILED", "Failed to update user profile", error);
    }
  };

  updateUsername = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const { username } = req.body;
    try {
      const result = await this.usersService.updateUsername(user.userId, username);
      return res.status(200).json({ message: "ユーザ名を更新しました", user: result });
    } catch (error) {
      if (error instanceof Error && error.message === "UsernameAlreadyExists") {
        throw new AppError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
      }
      throw this.internal("USERNAME_UPDATE_FAILED", "Failed to update username", error);
    }
  };

  toggleFollow = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.usersService.toggleFollow(user.userId, req.body.followeeId));
    } catch (error) {
      throw this.internal("USER_FOLLOW_UPDATE_FAILED", "Failed to update follow state", error);
    }
  };

  isFollowing = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.usersService.getIsFollowing(user.userId, String(req.params.followeeId)),
      );
    } catch (error) {
      throw this.internal("USER_FOLLOW_STATE_FETCH_FAILED", "Failed to fetch follow state", error);
    }
  };

  getFollowers = async (req: Request, res: Response) => {
    try {
      res.json(await this.usersService.getFollowers(String(req.params.userId)));
    } catch (error) {
      throw this.internal("USER_FOLLOWERS_FETCH_FAILED", "Failed to fetch followers", error);
    }
  };

  getFollowings = async (req: Request, res: Response) => {
    try {
      res.json(await this.usersService.getFollowings(String(req.params.userId)));
    } catch (error) {
      throw this.internal("USER_FOLLOWINGS_FETCH_FAILED", "Failed to fetch followings", error);
    }
  };

  getUploadedImages = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.uploadImagesService.getImagesByUserId(user.userId));
    } catch (error) {
      throw this.internal("UPLOADED_IMAGES_FETCH_FAILED", "Failed to fetch uploaded images", error);
    }
  };

  getUserIdentities = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.usersService.getUserIdentities(user.userId));
    } catch (error) {
      throw this.internal("USER_IDENTITIES_FETCH_FAILED", "Failed to fetch user identities", error);
    }
  };

  uploadLocalAvatar = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const userId = user.userId;
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${userId}_local${ext}`);
      },
    });
    const upload = multer({ storage }).single("image");

    upload(req, res, async (error: any) => {
      if (error) {
        return res.status(500).json({
          error: { code: "AVATAR_UPLOAD_FAILED", message: "Avatar upload failed", details: null },
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

      const pathname = `/uploads/avatars/${req.file.filename}`;
      try {
        await this.usersService.updateLocalAvatar(userId, pathname);
        return res.status(200).json({
          message: "プロフィール画像をアップロードしました",
          pathname,
        });
      } catch (dbError) {
        console.error("Avatar DB update failed", dbError);
        return res.status(500).json({
          error: {
            code: "AVATAR_UPDATE_FAILED",
            message: "Failed to update avatar",
            details: null,
          },
        });
      }
    });
  };

  getFollowingTags = async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      res.json(await this.tagsService.getFollowingTags(userId, page, limit));
    } catch (error) {
      throw this.internal("FOLLOWING_TAGS_FETCH_FAILED", "Failed to fetch following tags", error);
    }
  };

  getMyFollowingtags = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.usersService.getFollowingTags(user.userId));
    } catch (error) {
      throw this.internal("FOLLOWING_TAGS_FETCH_FAILED", "Failed to fetch following tags", error);
    }
  };

  getPickupArticles = async (req: Request, res: Response) => {
    try {
      res.json(await this.usersService.getPickupArticles(String(req.params.userId)));
    } catch (error) {
      throw this.internal("PICKUP_ARTICLES_FETCH_FAILED", "Failed to fetch pickup articles", error);
    }
  };

  createPickupArticle = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.usersService.createPickupArticle(user.userId, String(req.body.articleId)));
    } catch (error) {
      throw this.internal("PICKUP_ARTICLE_CREATE_FAILED", "Failed to create pickup article", error);
    }
  };

  deletePickupArticle = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.usersService.deletePickupArticle(user.userId, String(req.body.articleId)));
    } catch (error) {
      throw this.internal("PICKUP_ARTICLE_DELETE_FAILED", "Failed to delete pickup article", error);
    }
  };

  getCommentCount = async (req: Request, res: Response) => {
    try {
      const result = await this.usersService.getUserCommentCount(String(req.params.userId));
      res.json({ commentCount: result });
    } catch (error) {
      throw this.internal("USER_COMMENT_COUNT_FETCH_FAILED", "Failed to fetch comment count", error);
    }
  };

  getArticleCount = async (req: Request, res: Response) => {
    try {
      const result = await this.usersService.getUserArticleCount(String(req.params.userId));
      res.json({ articleCount: result });
    } catch (error) {
      throw this.internal("USER_ARTICLE_COUNT_FETCH_FAILED", "Failed to fetch article count", error);
    }
  };

  getAllRanking = async (_req: Request, res: Response) => {
    try {
      res.json(await this.usersService.getAllRanking());
    } catch (error) {
      throw this.internal("USER_RANKING_FETCH_FAILED", "Failed to fetch user ranking", error);
    }
  };

  getApiKeys = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const keys = await this.usersService.getUserApiKeys(user.userId);
      res.json(keys.map(({ api_key_hash, ...key }) => key));
    } catch (error) {
      throw this.internal("API_KEY_LIST_FETCH_FAILED", "Failed to fetch API keys", error);
    }
  };

  createApiKey = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const { name, expiresAt } = req.body;
    const fields: Record<string, string[]> = {};
    if (typeof name !== "string" || !name.trim()) fields.name = ["API_KEY_NAME_REQUIRED"];
    if (expiresAt && new Date(expiresAt) <= new Date()) fields.expiresAt = ["FUTURE_DATE_REQUIRED"];
    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    try {
      const result = await this.usersService.createApiKey(
        user.userId,
        name,
        expiresAt || null,
      );
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "ApiKeyGenerationDisabled") {
        throw new AppError(403, "API_KEY_GENERATION_DISABLED", "API key generation is disabled");
      }
      throw this.internal("API_KEY_CREATE_FAILED", "Failed to create API key", error);
    }
  };

  revokeApiKey = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      await this.usersService.revokeApiKey(user.userId, String(req.params.apiKeyId));
      res.json({ message: "APIキーを削除しました" });
    } catch (error) {
      throw this.internal("API_KEY_REVOKE_FAILED", "Failed to revoke API key", error);
    }
  };
}
