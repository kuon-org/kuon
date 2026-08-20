import { isAuthenticated } from "../middlewares/auth.js";
export class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
        this.getUserList = async (req, res) => {
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const isAdmin = await this.adminService.isAdmin(req.user.userId);
                if (!isAdmin)
                    return res.status(403).json({ message: "権限がありません" });
                const users = await this.adminService.getUserList();
                res.status(200).json(users);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : "エラーが発生しました",
                });
            }
        };
        this.toggleUserActive = async (req, res) => {
            const userId = String(req.params.userId);
            try {
                if (!isAuthenticated(req)) {
                    return res.status(401).json({ message: "未ログインです" });
                }
                const isAdmin = await this.adminService.isAdmin(req.user.userId);
                if (!isAdmin)
                    return res.status(403).json({ message: "権限がありません" });
                const result = await this.adminService.toggleUserActive(userId);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(500).json({
                    message: error instanceof Error ? error.message : "エラーが発生しました",
                });
            }
        };
    }
}
