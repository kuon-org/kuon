import { Request, Response } from "express";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { generate2FASecret } from "../utils/2fa/index.js";
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
  getCookieOptions,
} from "../utils/sessionTokens/index.js";
import { TOTP } from "@otplib/totp";
import qrcode from "qrcode";
import NodeCryptoPlugin from "@otplib/plugin-crypto-node";
import ScureBase32Plugin from "@otplib/plugin-base32-scure";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UsersService } from "../services/usersService.js";
import { UploadImagesService } from "../services/uploadImagesService.js";
import { TagsService } from "../services/tagsService.js";
import { getDeviceNameFromUserAgent } from "../utils/uaParser/index.js";

export class UsersController {
  constructor(
    private usersService: UsersService,
    private tagsService: TagsService,
    private uploadImagesService: UploadImagesService,
  ) {}

  getMe = async (req: AuthRequest, res: Response) => {
    try {
      // ミドルウェア(authenticateToken)を通過していれば req.user.userId がある
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const user = await this.usersService.getUserById(req.user.userId);
      const enabled = await this.usersService.getIs2FAEnabled(req.user.userId);
      const role = await this.usersService.getUserRole(req.user.userId);
      const userWith2FA = { ...user, is_2fa_enabled: enabled, role: role };

      res.json(userWith2FA);
    } catch (error) {
      res.status(401).json({ message: "未ログインです" });
    }
  };

  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.usersService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getUserById = async (req: Request, res: Response) => {
    const userId = String(req.params.userId);
    try {
      const user = await this.usersService.getUserById(userId);
      res.json(user);
    } catch (error: any) {
      if (error.message === "UserNotFound") {
        return res.status(404).json({ message: "ユーザが見つかりません" });
      }
      res
        .status(500)
        .json({ message: error.message || "エラーが発生しました" });
    }
  };

  getUserByUsername = async (req: Request, res: Response) => {
    const username = String(req.params.username);
    try {
      const user = await this.usersService.getUserByUsername(username);
      res.json(user);
    } catch (error: any) {
      if (error.message === "UserNotFound") {
        return res.status(404).json({ message: "ユーザが見つかりません" });
      }
      res
        .status(500)
        .json({ message: error.message || "エラーが発生しました" });
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
    } catch (error: any) {
      if (error.message === "UsernameAlreadyExists") {
        return res
          .status(409)
          .json({ message: "このユーザ名はすでに使用されています" });
      }
      if (error.message === "EmailAlreadyRegistered") {
        return res
          .status(409)
          .json({ message: "このメールアドレスはすでに登録済みです" });
      }
      res
        .status(500)
        .json({ message: error.message || "エラーが発生しました" });
    }
  };

  private getSessionMetadata(req: Request) {
    const userAgent = req.get("User-Agent") ?? undefined;
    return {
      ipAddress: this.getClientIp(req),
      userAgent,
      deviceName: getDeviceNameFromUserAgent(userAgent),
    };
  }

  private getClientIp(req: Request) {
    return (
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip
    );
  }

  loginUser = async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    const metadata = this.getSessionMetadata(req);

    try {
      const user = await this.usersService.loginUser(identifier, password);
      const required = await this.usersService.getIs2FAEnabled(user.id);
      // 🔹 2FA有効ユーザーか確認
      if (required) {
        // JWT はまだ発行せず、2FA入力ステップへ誘導
        return res.json({
          requires2FA: true,
          email: user.email,
          message: "二段階認証コードを入力してください",
        });
      }
      await this.usersService.updateLastLogin(user.id);
      const session = await this.usersService.createSessionForUser(
        user.id,
        metadata,
      );

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

      res.json({
        message: "ログインに成功しました",
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error: any) {
      if (
        ["InvalidCredentials", "AccountNotFound", "UserNotFound"].includes(
          error.message,
        )
      ) {
        return res.status(401).json({ message: "認証に失敗しました" });
      }
      res
        .status(500)
        .json({ message: error.message || "エラーが発生しました" });
    }
  };

  verifyLogin2FA = async (req: Request, res: Response) => {
    const { email, token } = req.body;
    const metadata = this.getSessionMetadata(req);
    try {
      const user = await this.usersService.verifyLogin2FA(email, token);
      console.log(user);
      await this.usersService.updateLastLogin(user.id);
      const session = await this.usersService.createSessionForUser(
        user.id,
        metadata,
      );

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

      res.json({
        success: true,
        message: "二段階認証が完了しました",
        user: { id: user.id, username: user.username },
      });
    } catch (error: any) {
      res
        .status(400)
        .json({ message: error.message || "認証コードの検証に失敗しました" });
    }
  };

  logoutUser = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      await this.usersService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie("access_token", getCookieOptions(0));
    res.clearCookie("refresh_token", getCookieOptions(0));

    res.status(200).json({ message: "ログアウトしました" });
  };

  getDevices = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const sessions = await this.usersService.getUserSessions(req.user.userId);
      const result = sessions.map(({ refresh_token, ...s }) => ({
        ...s,
        is_current: s.id === req.user.sessionId,
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "デバイス一覧の取得に失敗しました" });
    }
  };

  logoutAllDevices = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      await this.usersService.deleteAllSessionsByUser(req.user.userId);
      res.clearCookie("access_token", getCookieOptions(0));
      res.clearCookie("refresh_token", getCookieOptions(0));
      res.json({ message: "すべてのデバイスからログアウトしました" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "すべてのデバイスからのログアウトに失敗しました" });
    }
  };

  logoutDevice = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const sessionId = String(req.params.sessionId);
      if (!sessionId) {
        return res.status(400).json({ message: "セッションIDが必要です" });
      }
      await this.usersService.deleteSessionById(sessionId);
      res.json({ message: "指定されたデバイスからログアウトしました" });
    } catch (error) {
      res.status(500).json({ message: "デバイスのログアウトに失敗しました" });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ message: "リフレッシュトークンが必要です" });
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
    } catch (error: any) {
      res.clearCookie("access_token", getCookieOptions(0));
      res.clearCookie("refresh_token", getCookieOptions(0));
      res.status(401).json({ message: "リフレッシュトークンが無効です" });
    }
  };

  changePassword = async (req: Request, res: Response) => {
    const userId = String(req.params.userId);

    const { currentPass, newPassword } = req.body;
    try {
      const account = await this.usersService.changePassword(
        userId,
        currentPass,
        newPassword,
      );
      res.json({ message: "パスワードを更新しました", accountId: account.id });
    } catch (error: any) {
      if (error.message === "UserNotFound") {
        return res.status(404).json({ message: "ユーザが見つかりません" });
      }
      res
        .status(500)
        .json({ message: error.message || "エラーが発生しました" });
    }
  };

  updateUserInfo = async (req: AuthRequest, res: Response) => {
    const { displayName, bio } = req.body;
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const result = await this.usersService.updateUserInfo(
        req.user.userId,
        displayName,
        bio,
      );
      return res.status(200).json({
        message: "ユーザ情報を更新しました",
        user: result,
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  updateUsername = async (req: AuthRequest, res: Response) => {
    const { username } = req.body;
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const result = await this.usersService.updateUsername(
        req.user.userId,
        username,
      );
      return res.status(200).json({
        message: "ユーザ名を更新しました",
        user: result,
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  toggleFollow = async (req: AuthRequest, res: Response) => {
    const { followeeId } = req.body;
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const result = await this.usersService.toggleFollow(
        req.user.userId,
        followeeId,
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  isFollowing = async (req: AuthRequest, res: Response) => {
    const followeeId = String(req.params.followeeId);
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const result = await this.usersService.getIsFollowing(
        req.user.userId,
        followeeId,
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getFollowers = async (req: Request, res: Response) => {
    const userId = String(req.params.userId);
    try {
      const result = await this.usersService.getFollowers(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getFollowings = async (req: Request, res: Response) => {
    const userId = String(req.params.userId);
    try {
      const result = await this.usersService.getFollowings(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  setUp2FA = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }

      // ユーザー情報取得
      const { email } = await this.usersService.get2FASettingValue(
        req.user.userId,
      );
      if (!email)
        return res
          .status(500)
          .json({ message: "メールアドレスの取得に失敗しました。" });
      // 2FAシークレット生成
      const { secret, otpauthUrl } = generate2FASecret(email);

      // DB に仮保存（まだ is_2fa_enabled は false）
      await this.usersService.saveTemp2FASecret(req.user.userId, secret);
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
      // フロントに QR コード URL を返す
      res.json({ qrCodeUrl: qrCodeDataUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "2FA 設定中にエラーが発生しました" });
    }
  };

  verify2FA = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }

      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "認証コードが必要です。" });
      }
      const { totp_secret } = await this.usersService.get2FASettingValue(
        req.user.userId,
      );
      if (!totp_secret) {
        return res
          .status(400)
          .json({ message: "2FA がまだ設定されていません。" });
      }
      const totp = new TOTP({
        crypto: new NodeCryptoPlugin(),
        base32: new ScureBase32Plugin(),
      });

      const isValid = await totp.verify(token, {
        secret: totp_secret,
      });

      if (!isValid) {
        return res
          .status(400)
          .json({ message: "認証コードが正しくありません" });
      }

      await this.usersService.save2FASecret(req.user.userId, totp_secret);

      res.json({ success: true, message: "二段階認証を有効化しました" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "2FA 検証中にエラーが発生しました" });
    }
  };

  delete2FA = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      await this.usersService.delete2FASettings(req.user.userId);
      res.status(201).json({ message: "success" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "2FA 検証中にエラーが発生しました" });
    }
  };
  getUploadedImages = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const result = await this.uploadImagesService.getImagesByUserId(
        req.user.userId,
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getUserIdentities = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const result = await this.usersService.getUserIdentities(req.user.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  uploadLocalAvatar = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const userId = req.user.userId;
      const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      let filename;
      const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          filename = `${userId}_local${ext}`;
          cb(null, filename); // 例: "018db2a5-xxxx.png"
        },
      });
      const upload = multer({ storage }).single("image");

      // upload関数の実行
      upload(req, res, async (err: any) => {
        if (err)
          return res
            .status(500)
            .json({ message: "アップロードに失敗しました" });
        if (!req.file)
          return res.status(400).json({ message: "ファイルがありません" });

        // 【重要】ファイル保存完了後に req.file から取得する
        // publicを省いた、ブラウザからアクセス可能なパスを構築
        const pathname = `/uploads/avatars/${req.file.filename}`;

        try {
          await this.usersService.updateLocalAvatar(userId, pathname);
          return res.status(200).json({
            message: "プロフィール画像をアップロードしました",
            pathname,
          });
        } catch (dbError) {
          return res.status(500).json({ message: "DB更新に失敗しました" });
        }
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  getFollowingTags = async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const result = await this.tagsService.getFollowingTags(
        userId,
        page,
        limit,
      );
      console.log("フォロー中のタグ", result);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getMyFollowingtags = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const result = await this.usersService.getFollowingTags(req.user.userId);
      console.log(result);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getPickupArticles = async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const result = await this.usersService.getPickupArticles(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  createPickupArticle = async (req: AuthRequest, res: Response) => {
    try {
      const articleId = String(req.body.articleId);
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const result = await this.usersService.createPickupArticle(
        req.user.userId,
        articleId,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
  deletePickupArticle = async (req: AuthRequest, res: Response) => {
    try {
      const articleId = String(req.body.articleId);
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const result = await this.usersService.deletePickupArticle(
        req.user.userId,
        articleId,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getCommentCount = async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const result = await this.usersService.getUserCommentCount(userId);
      res.json({ commentCount: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getArticleCount = async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const result = await this.usersService.getUserArticleCount(userId);
      res.json({ articleCount: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getAllRanking = async (req: Request, res: Response) => {
    try {
      const result = await this.usersService.getAllRanking();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getApiKeys = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const keys = await this.usersService.getUserApiKeys(req.user.userId);
      // ハッシュ値を除外してレスポンス
      const result = keys.map(({ api_key_hash, ...k }) => k);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  createApiKey = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });

      const { name, expiresAt } = req.body; // expiresAt を受け取る

      if (!name) {
        return res
          .status(400)
          .json({ message: "APIキーの名称を入力してください" });
      }

      // セキュリティ上のバリデーション（例：過去の日付は不可）
      if (expiresAt && new Date(expiresAt) <= new Date()) {
        return res
          .status(400)
          .json({ message: "有効期限には未来の日時を指定してください" });
      }

      const result = await this.usersService.createApiKey(
        req.user.userId,
        name,
        expiresAt || null,
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  revokeApiKey = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const apiKeyId = String(req.params.apiKeyId);
      await this.usersService.revokeApiKey(req.user.userId, apiKeyId);
      res.json({ message: "APIキーを削除しました" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
