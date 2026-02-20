import { AuthRequest, isAuthenticated } from "../middlewares/auth";
import { Request, Response } from 'express';
import * as adminService from '../services/adminService'

export const getUserList = async (req: AuthRequest, res: Response) => {
    try {
        if (!isAuthenticated(req)) {
            return res.status(401).json({ message: "未ログインです" });
        }
        const isAdmin = await adminService.isAdmin(req.user.userId);
        if (!isAdmin) return res.status(403).json({ message: "権限がありません" });

    } catch (error) {
        res.status(500).json({ message: error instanceof Error ? error.message : 'エラーが発生しました' });
    }
}