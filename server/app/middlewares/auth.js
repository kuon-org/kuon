import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';
export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "認証が必要です" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // 後のコントローラーで req.user.userId が使える
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "トークンの有効期限が切れています" });
    }
};
export function isAuthenticated(req) {
    return !!req.user;
}
export const optionalAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        catch (err) {
            console.warn("Invalid or expired JWT:", err.message);
            // 無効なトークンの場合は単にスルーする（req.user は undefined のまま）
        }
    }
    next();
};
