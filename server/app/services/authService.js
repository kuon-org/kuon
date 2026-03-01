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
const pkceStore = new Map();
export class AuthService {
    constructor() {
        this.repo = new AuthRepository();
        this.AVATAR_DIR = "public/uploads/avatars";
    }
    async generateAuthUrl(providerName) {
        const record = await this.repo.findProviderByName(providerName);
        if (!record || !record.idp_configurations)
            throw new Error("Provider not found");
        const config = record.idp_configurations.config;
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
    async handleCallback(providerName, code, state, currentUserId) {
        const stored = pkceStore.get(state);
        if (!stored)
            throw new Error("Invalid state");
        const record = await this.repo.findProviderByName(providerName);
        if (!record || !record.idp_configurations)
            throw new Error("Provider not found");
        const config = record.idp_configurations.config;
        // 1. トークン取得 (結果はそのまま token_data として保存可能)
        const tokenData = await this.fetchToken(config, code, stored.verifier);
        // 2. ユーザー情報の取得元を切り替え
        let rawUserInfo;
        if (record.provider_type?.toUpperCase() === "OIDC") {
            if (!tokenData.id_token)
                throw new Error("id_token not found in OIDC response");
            rawUserInfo = jwt.decode(tokenData.id_token);
        }
        else {
            const res = await axios.get(config.user_info_url, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            rawUserInfo = res.data;
        }
        // 3. マッピング
        const idpUser = {
            id: String(get(rawUserInfo, config.mapping.id)),
            username: get(rawUserInfo, config.mapping.username),
            name: get(rawUserInfo, config.mapping.display_name),
        };
        // 4. ユーザー特定/作成 (tokenDataを丸ごと渡す)
        let user = await this.findOrCreateUser(record.id, idpUser, tokenData, currentUserId);
        if (user.is_active === false) {
            // pkceStoreのゴミ掃除をしてからエラーを投げる
            pkceStore.delete(state);
            throw new Error("このアカウントは無効化されています。管理者に問い合わせてください。");
        }
        // 5. アバター処理
        const remoteAvatarUrl = this.getAvatarUrl(rawUserInfo, config.mapping);
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
    async fetchToken(config, code, verifier) {
        const params = new URLSearchParams();
        params.set("grant_type", "authorization_code");
        params.set("code", code);
        params.set("redirect_uri", config.redirect_uri);
        params.set("client_id", config.client_id);
        params.set("client_secret", config.client_secret);
        params.set("code_verifier", verifier);
        const res = await axios.post(config.token_url, params.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        });
        return res.data; // access_token, refresh_token, id_token, expires_in 等が含まれる
    }
    getAvatarUrl(raw, mapping) {
        let url = get(raw, mapping.avatar_path);
        if (!url)
            return null;
        if (mapping.avatar_template) {
            const id = get(raw, mapping.id);
            url = mapping.avatar_template.replace("{id}", id).replace("{avatar}", url);
        }
        if (mapping.avatar_replace) {
            url = url.replace(mapping.avatar_replace.from, mapping.avatar_replace.to);
        }
        return url;
    }
    async downloadAvatar(userId, url, provider) {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const ext = path.extname(new URL(url).pathname) || ".png";
        const fileName = `${userId}_${provider}${ext}`;
        const filePath = path.join(this.AVATAR_DIR, fileName);
        await fs.mkdir(this.AVATAR_DIR, { recursive: true });
        await fs.writeFile(filePath, res.data);
        return `/uploads/avatars/${fileName}`;
    }
    async findOrCreateUser(providerId, idpUser, tokenData, currentUserId) {
        const identity = await this.repo.findIdentity(providerId, idpUser.id);
        if (identity)
            return this.repo.findUserById(identity.user_id).then(u => u);
        if (currentUserId) {
            await this.repo.linkIdentity(currentUserId, providerId, idpUser.id, tokenData);
            return this.repo.findUserById(currentUserId).then(u => u);
        }
        let baseUsername = idpUser.username || `user_${Math.random().toString(36).slice(2, 7)}`;
        let username = baseUsername;
        let count = 1;
        while (await this.repo.findUserByUsername(username)) {
            username = `${baseUsername}_${count++}`;
        }
        return this.repo.createUserWithIdentity({ username, display_name: idpUser.name || username }, { provider_id: providerId, provider_uid: idpUser.id, token_data: tokenData });
    }
    async switchAvatar(userId, avatarId) {
        return this.repo.setSelectedAvatar(userId, avatarId);
    }
    async unlinkService(userId, providerName) {
        const identityCount = await prisma.user_identities.count({ where: { user_id: userId } });
        if (identityCount <= 1)
            throw new Error("最後の連携手段を解除することはできません。");
        const files = await fs.readdir(this.AVATAR_DIR).catch(() => []);
        const targetFiles = files.filter(f => f.startsWith(`${userId}_${providerName}`));
        for (const file of targetFiles) {
            await fs.unlink(path.join(this.AVATAR_DIR, file)).catch(() => { });
        }
        return this.repo.deleteIdentityAndAvatar(userId, providerName);
    }
}
