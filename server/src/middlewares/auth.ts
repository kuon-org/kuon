import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

// ExpressのRequest型を拡張して user プロパティを使えるようにする
export interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

export interface AuthenticatedRequest extends Request {
    user: { // ? を外す
        userId: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "認証が必要です" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.user = decoded; // 後のコントローラーで req.user.userId が使える
        next();
    } catch (err) {
        return res.status(403).json({ message: "トークンの有効期限が切れています" });
    }
};

export function isAuthenticated(req: AuthRequest): req is AuthenticatedRequest {
    return !!req.user;
}


export const optionalAuth = (req: any, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            req.user = decoded;
        } catch (err) {
            console.warn("Invalid or expired JWT:", (err as Error).message);
            // 無効なトークンの場合は単にスルーする（req.user は undefined のまま）
        }
    }
    next();
};