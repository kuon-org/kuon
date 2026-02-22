// src/controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/authService.js";
import { AuthRequest } from "../middlewares/auth.js";

const BASE_URL = process.env.APP_SITE_URL ?? process.env.FRONTEND_URL
export class AuthController {
    private service = new AuthService();

    login = async (req: Request, res: Response) => {
        try {
            const { url } = await this.service.generateAuthUrl(String(req.params.provider));
            res.redirect(url);
        } catch (err) {
            res.status(500).json({ error: "Auth URL generation failed" });
        }
    };

    callback = async (req: AuthRequest, res: Response) => {

        try {
            const { code, state } = req.query;
            const token = await this.service.handleCallback(
                String(req.params.provider), code as string, state as string, req.user?.userId
            );
            res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400000 });
            res.redirect(BASE_URL || "http://localhost:5050");
        } catch (err: any) {
            // 詳細をコンソールに出す
            console.error("Auth Callback Error Details:", {
                message: err.message,
                stack: err.stack,
                response: err.response?.data // axiosのエラーだった場合、中身が見れる
            });
            res.status(500).json({ error: "Authentication failed", details: err.message });
        }
    };

    selectAvatar = async (req: AuthRequest, res: Response) => {
        try {
            const { avatarId } = req.body;
            if (!req.user?.userId) return res.status(401).send();
            await this.service.switchAvatar(req.user.userId, avatarId);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: "Failed to switch avatar" });
        }
    };
    unlinkProvider = async (req: AuthRequest, res: Response) => {
        try {
            const provider = String(req.params.provider);
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            // DBの削除実行
            await this.service.unlinkService(userId, provider); // または repo.deleteIdentityAndAvatar

            res.json({ success: true, message: `${provider} の連携を解除しました。` });
        } catch (err: any) {
            console.error("Unlink error:", err);
            res.status(500).json({ error: "連携解除に失敗しました。" });
        }
    };

}