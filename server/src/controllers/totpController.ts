import { Response } from "express";
import qrcode from "qrcode";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { TotpService } from "../services/totpService.js";

export class TotpController {
  constructor(private service: TotpService) {}

  setup = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }

      const { otpauthUrl } = await this.service.setup(req.user.userId);
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
      return res.json({ qrCodeUrl: qrCodeDataUrl });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "2FA 設定中にエラーが発生しました",
      });
    }
  };

  verifySetup = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      const { token } = req.body;
      if (typeof token !== "string" || !/^\d{6}$/.test(token)) {
        return res.status(400).json({ message: "6桁の認証コードを入力してください" });
      }

      await this.service.confirmSetup(req.user.userId, token);
      return res.json({ success: true, message: "二段階認証を有効化しました" });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "2FA 検証中にエラーが発生しました",
      });
    }
  };

  disable = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: "未ログインです" });
      }
      await this.service.disable(req.user.userId);
      return res.status(200).json({ message: "success" });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "2FA の無効化に失敗しました",
      });
    }
  };
}
