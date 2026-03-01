import jwt from 'jsonwebtoken';
import { isAuthenticated } from '../middlewares/auth.js';
import { generate2FASecret } from '../utils/2fa/index.js';
import { TOTP } from '@otplib/totp';
import qrcode from 'qrcode';
import NodeCryptoPlugin from '@otplib/plugin-crypto-node';
import ScureBase32Plugin from '@otplib/plugin-base32-scure';
import multer from "multer";
import path from "path";
import fs from "fs";
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export class UsersController {
    constructor(usersService, uploadImagesService) {
        this.usersService = usersService;
        this.uploadImagesService = uploadImagesService;
        this.getMe = async (req, res) => {
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
            }
            catch (error) {
                res.status(401).json({ message: "未ログインです" });
            }
        };
        this.getUsers = async (req, res) => {
            try {
                const users = await this.usersService.getAllUsers();
                res.json(users);
            }
            catch (error) {
                res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
            }
        };
        this.getUserById = async (req, res) => {
            const userId = String(req.params.userId);
            try {
                const user = await this.usersService.getUserById(userId);
                res.json(user);
            }
            catch (error) {
                if (error.message === "UserNotFound") {
                    return res.status(404).json({ message: "ユーザが見つかりません" });
                }
                res.status(500).json({ message: error.message || "エラーが発生しました" });
            }
        };
        this.getUserByUsername = async (req, res) => {
            const username = String(req.params.username);
            try {
                const user = await this.usersService.getUserByUsername(username);
                res.json(user);
            }
            catch (error) {
                if (error.message === "UserNotFound") {
                    return res.status(404).json({ message: "ユーザが見つかりません" });
                }
                res.status(500).json({ message: error.message || "エラーが発生しました" });
            }
        };
        this.registerUser = async (req, res) => {
            const { username, email, password, displayName } = req.body;
            try {
                const result = await this.usersService.registerUser(username, email, password, displayName);
                res.status(201).json({ user: result.user, account: result.account });
            }
            catch (error) {
                if (error.message === "UsernameAlreadyExists") {
                    return res.status(409).json({ message: "このユーザ名はすでに使用されています" });
                }
                if (error.message === "EmailAlreadyRegistered") {
                    return res.status(409).json({ message: "このメールアドレスはすでに登録済みです" });
                }
                res.status(500).json({ message: error.message || "エラーが発生しました" });
            }
        };
        this.loginUser = async (req, res) => {
            const { identifier, password } = req.body;
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
                // 🔹 通常ログイン（JWT発行）
                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 24 * 60 * 60 * 1000, // 24時間
                });
                res.json({
                    message: "ログインに成功しました",
                    user: {
                        id: user.id,
                        username: user.username,
                    },
                });
            }
            catch (error) {
                if (["InvalidCredentials", "AccountNotFound", "UserNotFound"].includes(error.message)) {
                    return res.status(401).json({ message: "認証に失敗しました" });
                }
                res.status(500).json({ message: error.message || "エラーが発生しました" });
            }
        };
        this.verifyLogin2FA = async (req, res) => {
            const { email, token } = req.body;
            try {
                const user = await this.usersService.verifyLogin2FA(email, token);
                console.log(user);
                await this.usersService.updateLastLogin(user.id);
                // 🔹 成功したら JWT 発行
                const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
                res.cookie("token", jwtToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 24 * 60 * 60 * 1000,
                });
                res.json({
                    success: true,
                    message: "二段階認証が完了しました",
                    user: { id: user.id, username: user.username },
                });
            }
            catch (error) {
                res.status(400).json({ message: error.message || "認証コードの検証に失敗しました" });
            }
        };
        this.logoutUser = async (req, res) => {
            // クッキー名を指定して削除（ログイン時に指定したオプションと同じにするのが安全）
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
            res.status(200).json({ message: "ログアウトしました" });
        };
        this.changePassword = async (req, res) => {
            const userId = String(req.params.userId);
            const { currentPass, newPassword } = req.body;
            try {
                const account = await this.usersService.changePassword(userId, currentPass, newPassword);
                res.json({ message: "パスワードを更新しました", accountId: account.id });
            }
            catch (error) {
                if (error.message === "UserNotFound") {
                    return res.status(404).json({ message: "ユーザが見つかりません" });
                }
                res.status(500).json({ message: error.message || "エラーが発生しました" });
            }
        };
        this.updateUserInfo = async (req, res) => {
            const { displayName, bio } = req.body;
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const result = await this.usersService.updateUserInfo(req.user.userId, displayName, bio);
                return res.status(200).json({
                    message: "ユーザ情報を更新しました",
                    user: result,
                });
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.updateUsername = async (req, res) => {
            const { username } = req.body;
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const result = await this.usersService.updateUsername(req.user.userId, username);
                return res.status(200).json({
                    message: "ユーザ名を更新しました",
                    user: result,
                });
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.toggleFollow = async (req, res) => {
            const { followeeId } = req.body;
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const result = await this.usersService.toggleFollow(req.user.userId, followeeId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.isFollowing = async (req, res) => {
            const followeeId = String(req.params.followeeId);
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const result = await this.usersService.getIsFollowing(req.user.userId, followeeId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.getFollowers = async (req, res) => {
            const userId = String(req.params.userId);
            try {
                const result = await this.usersService.getFollowers(userId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.getFollowings = async (req, res) => {
            const userId = String(req.params.userId);
            try {
                const result = await this.usersService.getFollowings(userId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.setUp2FA = async (req, res) => {
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                // ユーザー情報取得
                const { email } = await this.usersService.get2FASettingValue(req.user.userId);
                if (!email)
                    return res.status(500).json({ message: "メールアドレスの取得に失敗しました。" });
                // 2FAシークレット生成
                const { secret, otpauthUrl } = generate2FASecret(email);
                // DB に仮保存（まだ is_2fa_enabled は false）
                await this.usersService.saveTemp2FASecret(req.user.userId, secret);
                const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
                // フロントに QR コード URL を返す
                res.json({ qrCodeUrl: qrCodeDataUrl });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ message: "2FA 設定中にエラーが発生しました" });
            }
        };
        this.verify2FA = async (req, res) => {
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const { token } = req.body;
                if (!token) {
                    return res.status(400).json({ message: "認証コードが必要です。" });
                }
                const { totp_secret } = await this.usersService.get2FASettingValue(req.user.userId);
                if (!totp_secret) {
                    return res.status(400).json({ message: "2FA がまだ設定されていません。" });
                }
                const totp = new TOTP({
                    crypto: new NodeCryptoPlugin(),
                    base32: new ScureBase32Plugin(),
                });
                const isValid = await totp.verify(token, {
                    secret: totp_secret,
                });
                if (!isValid) {
                    return res.status(400).json({ message: "認証コードが正しくありません" });
                }
                await this.usersService.save2FASecret(req.user.userId, totp_secret);
                res.json({ success: true, message: "二段階認証を有効化しました" });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ message: "2FA 検証中にエラーが発生しました" });
            }
        };
        this.delete2FA = async (req, res) => {
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                await this.usersService.delete2FASettings(req.user.userId);
                res.status(201).json({ message: "success" });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ message: "2FA 検証中にエラーが発生しました" });
            }
        };
        this.getUploadedImages = async (req, res) => {
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const result = await this.uploadImagesService.getImagesByUserId(req.user.userId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.getUserIdentities = async (req, res) => {
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const result = await this.usersService.getUserIdentities(req.user.userId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
        this.uploadLocalAvatar = async (req, res) => {
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
                upload(req, res, async (err) => {
                    if (err)
                        return res.status(500).json({ message: "アップロードに失敗しました" });
                    if (!req.file)
                        return res.status(400).json({ message: "ファイルがありません" });
                    // 【重要】ファイル保存完了後に req.file から取得する
                    // publicを省いた、ブラウザからアクセス可能なパスを構築
                    const pathname = `/uploads/avatars/${req.file.filename}`;
                    try {
                        await this.usersService.updateLocalAvatar(userId, pathname);
                        return res.status(200).json({ message: "プロフィール画像をアップロードしました", pathname });
                    }
                    catch (dbError) {
                        return res.status(500).json({ message: "DB更新に失敗しました" });
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'エラーが発生しました',
                });
            }
        };
    }
}
