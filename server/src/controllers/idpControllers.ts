import { AuthRequest, isAuthenticated } from "../middlewares/auth";
import { IdpConfigurationsService } from "../services/idpConfigurationsService";
import { Request, Response } from "express";

export class IdpController {

    constructor(
        private idpService: IdpConfigurationsService,
    ) { }

    getActiveIdp = async (_req: Request, res: Response) => {
        try {
            const ap = await this.idpService.getProviders();
            res.json(ap);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    getIdpConf = async (req: AuthRequest, res: Response) => {
        const provider_name = String(req.params.provider_name);
        try {
            if (!isAuthenticated(req)) return res.status(401).json({ message: "未ログインです" });
            const ic = await this.idpService.getProviderConfiguration(req.user.userId, provider_name);
            res.json(ic);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    upsertIdp = async (req: AuthRequest, res: Response) => {
        try {
            if (!isAuthenticated(req)) return res.status(401).json({ message: "未ログインです" });
            const userId = req.user.userId;
            const { provider_name, client_id, client_secret } = req.body;
            console.log(client_secret)
            if (!provider_name || !client_id || !client_secret) {
                return res.status(400).json({ message: "provider_name, client_id, client_secret が必要です" });
            }

            const updated = await this.idpService.upsertIdp(userId, provider_name, { client_id, client_secret });

            res.json(updated);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    toggleActive = async (req: AuthRequest, res: Response) => {

        const provider_name = String(req.params.provider_name);
        try {
            if (!isAuthenticated(req)) return res.status(401).json({ message: "未ログインです" });
            const userId = req.user.userId;

            await this.idpService.toggleActive(userId, provider_name)
            res.json({ message: "ok"})
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

}