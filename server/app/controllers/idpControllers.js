import { isAuthenticated } from "../middlewares/auth.js";
import axios from 'axios';
export class IdpController {
    constructor(idpService) {
        this.idpService = idpService;
        this.getActiveIdp = async (_req, res) => {
            try {
                const ap = await this.idpService.getProviders();
                res.json(ap);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getAllProviders = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const list = await this.idpService.getAllProvidersList(req.user.userId);
                res.json(list);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getIdpConf = async (req, res) => {
            const provider_name = String(req.params.provider_name);
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const ic = await this.idpService.getProviderConfiguration(req.user.userId, provider_name);
                res.json(ic);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.discoverOidc = async (req, res) => {
            try {
                const { issuer_host } = req.query;
                if (!issuer_host)
                    return res.status(400).json({ message: "issuer_hostが必要です" });
                const discoveryUrl = `${String(issuer_host).replace(/\/$/, "")}/.well-known/openid-configuration`;
                const { data } = await axios.get(discoveryUrl);
                console.log(data);
                res.json({
                    auth_url: data.authorization_endpoint,
                    token_url: data.token_endpoint,
                    user_info_url: data.userinfo_endpoint,
                });
            }
            catch (error) {
                res.status(500).json({ message: "Discoveryに失敗しました。URLを確認してください。" });
            }
        };
        this.upsertIdp = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const userId = req.user.userId;
                // config全体を受け取るように拡張
                const { provider_name, ...restData } = req.body;
                if (!provider_name)
                    return res.status(400).json({ message: "provider_nameが必要です" });
                const updated = await this.idpService.upsertIdp(userId, provider_name, restData);
                res.json(updated);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.toggleActive = async (req, res) => {
            const provider_name = String(req.params.provider_name);
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const userId = req.user.userId;
                await this.idpService.toggleActive(userId, provider_name);
                res.json({ message: "ok" });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.deleteIdp = async (req, res) => {
            const provider_name = String(req.params.provider_name);
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const userId = req.user.userId;
                const result = await this.idpService.deleteIdp(userId, provider_name);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
    }
}
