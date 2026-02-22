// src/services/authService.ts
import axios from "axios";
import * as pkce from "pkce-challenge";
import jwt from "jsonwebtoken";
import fs from "node:fs/promises";
import path from "node:path";
import { get } from "lodash-es";
import { AuthRepository } from "../repositories/authRepository.js";
import prisma from "../prisma/client.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const pkceStore = new Map<string, { verifier: string }>();

export class AuthService {
    private repo = new AuthRepository();
    private AVATAR_DIR = "public/uploads/avatars";

    async generateAuthUrl(providerName: string) {
        const record = await this.repo.findProviderByName(providerName);
        if (!record || !record.idp_configurations) throw new Error("Provider not found");

        const config = record.idp_configurations.config as any;
        const { code_verifier, code_challenge } = await pkce.default();
        const state = crypto.randomUUID();
        pkceStore.set(state, { verifier: code_verifier });

        const url = new URL(config.auth_url);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("client_id", config.client_id);
        url.searchParams.set("redirect_uri", config.redirect_uri);
        url.searchParams.set("scope", config.scope);
        url.searchParams.set("state", state);
        url.searchParams.set("code_challenge", code_challenge);
        url.searchParams.set("code_challenge_method", "S256");

        return { url: url.toString() };
    }

    async handleCallback(providerName: string, code: string, state: string, currentUserId?: string) {
        const stored = pkceStore.get(state);
        if (!stored) throw new Error("Invalid state");

        const record = await this.repo.findProviderByName(providerName);
        const config = record!.idp_configurations!.config as any;

        // 1. トークン & ユーザー情報取得
        const tokenData = await this.fetchToken(config, code, stored.verifier);
        const rawUserInfo = await this.fetchUserInfo(config.user_info_url, tokenData.access_token);
        console.log("Raw User Info:", JSON.stringify(rawUserInfo, null, 2)); // これを追加

        // 2. マッピング
        const { idpUser, remoteAvatarUrl } = this.parseUserInfo(rawUserInfo, config.mapping);

        // 3. ユーザー特定・作成
        let user = await this.findOrCreateUser(record!.id, idpUser, tokenData, currentUserId);

        // 4. アバター処理
        if (remoteAvatarUrl) {
            const localPath = await this.downloadAvatar(user.id, remoteAvatarUrl, providerName);
            await prisma.$transaction(async (tx) => {
                const current = await tx.user_avatars.findFirst({ where: { user_id: user.id, is_selected: true } });
                const shouldSelect = !current || !user.avatar_url;

                await this.repo.upsertAvatar(tx, {
                    userId: user.id, serviceName: providerName,
                    avatarUrl: localPath, sourceUrl: remoteAvatarUrl, isSelected: shouldSelect
                });

                if (shouldSelect) {
                    user = await tx.users.update({ where: { id: user.id }, data: { avatar_url: localPath } });
                }
            });
        }
        await this.repo.updateLastLogin(user.id);
        pkceStore.delete(state);
        return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
    }

    private parseUserInfo(data: any, mapping: any) {
        const rawId = get(data, mapping.id);
        const id = String(rawId);
        const rawAvatar = get(data, mapping.avatar_path);
        let remoteAvatarUrl = rawAvatar;

        if (mapping.avatar_template) {
            remoteAvatarUrl = mapping.avatar_template.replace("{id}", id).replace("{avatar}", rawAvatar);
        } else if (mapping.avatar_replace && remoteAvatarUrl) {
            remoteAvatarUrl = remoteAvatarUrl.replace(mapping.avatar_replace.from, mapping.avatar_replace.to);
        }

        return {
            idpUser: { id, username: get(data, mapping.username), name: get(data, mapping.display_name) },
            remoteAvatarUrl
        };
    }

    private async downloadAvatar(userId: string, url: string, provider: string) {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const ext = path.extname(new URL(url).pathname) || '.png';
        const fileName = `${userId}_${provider}${ext}`;
        const fullPath = path.join(this.AVATAR_DIR, fileName);
        await fs.mkdir(this.AVATAR_DIR, { recursive: true });
        await fs.writeFile(fullPath, res.data);
        console.log("downloadAvatar")
        return `/uploads/avatars/${fileName}`;
    }


    private async fetchToken(config: any, code: string, verifier: string) {
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: config.redirect_uri,
            code_verifier: verifier,
            client_id: config.client_id,
        });

        // GitHubの場合は client_secret を body に含める
        if (config.provider_name === "github" && config.client_secret) {
            params.set("client_secret", config.client_secret);
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json", // ← GitHubはこれがないとURLエンコード形式で返す
        };

        // TwitterなどBasic認証が必要なものだけこのブロックを使う
        if (config.provider_name !== "github" && config.client_secret) {
            const credentials = Buffer.from(`${config.client_id}:${config.client_secret}`).toString("base64");
            headers["Authorization"] = `Basic ${credentials}`;
        }


        const res = await axios.post(config.token_url, params.toString(), { headers });
        return res.data;
    }
    private async fetchUserInfo(url: string, token: string) {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    }

    private async findOrCreateUser(providerId: string, idpUser: any, tokenData: any, currentUserId?: string) {
        const identity = await this.repo.findIdentity(providerId, idpUser.id);
        if (identity) return this.repo.findUserById(identity.user_id).then(u => u!);

        if (currentUserId) {
            await prisma.user_identities.create({
                data: { user_id: currentUserId, provider_id: providerId, provider_uid: idpUser.id, token_data: tokenData }
            });
            return this.repo.findUserById(currentUserId).then(u => u!);
        }

        const baseUsername = idpUser.username || idpUser.id;
        let username = baseUsername;
        let count = 1;
        while (await this.repo.findUserByUsername(username)) {
            username = `${baseUsername}_${count++}`;
        }

        return this.repo.createUserWithIdentity(
            { username, display_name: idpUser.name || username },
            { provider_id: providerId, provider_uid: idpUser.id, token_data: tokenData }
        );
    }

    async switchAvatar(userId: string, avatarId: string) {
        return this.repo.setSelectedAvatar(userId, avatarId);
    }

    async unlinkService(userId: string, providerName: string) {
        // 1. ファイルの削除（拡張子が不明な場合が多いので、特定して消す）
        // userId_providerName.* に一致するファイルを掃除
        try {
            // セキュリティ：最後の連携手段を解除しようとしていないかチェック
            const identityCount = await prisma.user_identities.count({
                where: { user_id: userId }
            });

            if (identityCount <= 1) {
                throw new Error("最後の連携手段を解除することはできません。他のログイン手段を追加してください。")
            }
            const files = await fs.readdir(this.AVATAR_DIR);
            const targetFiles = files.filter(f => f.startsWith(`${userId}_${providerName}`));

            for (const file of targetFiles) {
                await fs.unlink(path.join(this.AVATAR_DIR, file));
            }
        } catch (err) {
            console.error("File deletion failed:", err);
            // ファイル削除失敗でトランザクション全体を止めるかは要検討
        }

        // 2. DBレコードの削除
        return this.repo.deleteIdentityAndAvatar(userId, providerName);
    }
}