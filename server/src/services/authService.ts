// src/services/authService.ts
import axios from "axios";
import * as pkce from "pkce-challenge";
import jwt from "jsonwebtoken";
import fs from "node:fs/promises";
import path from "node:path";
import { get } from "lodash-es";
import { AuthRepository } from "../repositories/authRepository.js";
import prisma from "../prisma/client.js";
import { SAML } from "@node-saml/node-saml";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// userId を保持できるように拡張
const pkceStore = new Map<string, { verifier: string; userId?: string }>();

export class AuthService {
  constructor(private repo: AuthRepository) {}
  private AVATAR_DIR = "public/uploads/avatars";

  async generateAuthUrl(providerName: string, currentUserId?: string) {
    const record = await this.repo.findProviderByName(providerName);
    if (!record || !record.idp_configurations)
      throw new Error("Provider not found");
    const config = record.idp_configurations.config as any;

    const { code_verifier, code_challenge } = await pkce.default();
    const state = crypto.randomUUID();

    // pkceStore に userId も保存
    pkceStore.set(state, { verifier: code_verifier, userId: currentUserId });
    console.log("Timing generateAuthUrl currentUserId:", currentUserId);
    if (record.provider_type === "SAML") {
      const saml = await this.getSamlInstance(providerName);
      // 第1引数の state は RelayState として IdP に送られ、戻ってくる
      const authUrl = await saml.getAuthorizeUrlAsync(state, undefined, {});

      // --- デバッグ開始 ---
      console.log("---------- SAML DEBUG START ----------");
      console.log("Target URL (Keycloak SSO):", config.entry_point);
      console.log("Generated Auth URL:", authUrl);

      // URLからSAMLRequestパラメータを抽出してデコードするためのヒント
      const urlParams = new URL(authUrl).searchParams;
      console.log("SAMLRequest (Raw):", urlParams.get("SAMLRequest"));
      console.log("---------- SAML DEBUG END ----------");
      // --- デバッグ終了 ---
      return { url: authUrl };
    }

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

  async handleCallback(
    providerName: string,
    code: string,
    state: string,
    fallbackUserId?: string,
  ) {
    const stored = pkceStore.get(state);
    if (!stored) throw new Error("Invalid state");

    // pkceStore に保存されていた userId を優先的に使用
    const currentUserId = stored.userId || fallbackUserId;

    const record = await this.repo.findProviderByName(providerName);
    if (!record || !record.idp_configurations)
      throw new Error("Provider not found");
    const config = record.idp_configurations.config as any;

    const tokenData = await this.fetchToken(config, code, stored.verifier);

    let rawUserInfo: any;
    if (record.provider_type?.toUpperCase() === "OIDC") {
      if (!tokenData.id_token)
        throw new Error("id_token not found in OIDC response");
      rawUserInfo = jwt.decode(tokenData.id_token);
    } else {
      const res = await axios.get(config.user_info_url, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      rawUserInfo = res.data;
    }

    const idpUser = {
      id: String(get(rawUserInfo, config.mapping.id)),
      username: get(rawUserInfo, config.mapping.username),
      name: get(rawUserInfo, config.mapping.display_name),
    };

    let user = await this.findOrCreateUser(
      record.id,
      idpUser,
      tokenData,
      currentUserId,
    );

    if (user.is_active === false) {
      pkceStore.delete(state);
      throw new Error("このアカウントは無効化されています。");
    }

    const remoteAvatarUrl = this.getAvatarUrl(rawUserInfo, config.mapping);
    if (remoteAvatarUrl) {
      const localPath = await this.downloadAvatar(
        user.id,
        remoteAvatarUrl,
        providerName,
      );
      await prisma.$transaction(async (tx) => {
        const current = await tx.user_avatars.findFirst({
          where: { user_id: user.id, is_selected: true },
        });
        const shouldSelect = !current || !user.avatar_url;
        await this.repo.upsertAvatar(tx, {
          userId: user.id,
          serviceName: providerName,
          avatarUrl: localPath,
          sourceUrl: remoteAvatarUrl,
          isSelected: shouldSelect,
        });
        if (shouldSelect) {
          user = await tx.users.update({
            where: { id: user.id },
            data: { avatar_url: localPath },
          });
        }
      });
    }

    await this.repo.updateLastLogin(user.id);
    pkceStore.delete(state);
    return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
  }

  private async fetchToken(config: any, code: string, verifier: string) {
    const params = new URLSearchParams();
    params.set("grant_type", "authorization_code");
    params.set("code", code);
    params.set("redirect_uri", config.redirect_uri);
    params.set("client_id", config.client_id);
    params.set("client_secret", config.client_secret);
    params.set("code_verifier", verifier);
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    if (config.auth_method === "header") {
      // Twitterなどの Basic 認証パターン
      const basicAuth = Buffer.from(
        `${config.client_id}:${config.client_secret}`,
      ).toString("base64");
      headers["Authorization"] = `Basic ${basicAuth}`;
      // Header認証の場合、Bodyに client_id を含めても良いですが、
      // Twitterは厳格なので Secret は Body に含めないのが安全です
      params.set("client_id", config.client_id);
    } else {
      // GitHubなどの Body 認証パターン
      params.set("client_id", config.client_id);
      params.set("client_secret", config.client_secret);
    }

    const res = await axios.post(config.token_url, params.toString(), {
      headers,
    });
    return res.data;
  }

  private getAvatarUrl(raw: any, mapping: any): string | null {
    let url = get(raw, mapping.avatar_path);
    if (!url) return null;
    if (mapping.avatar_template) {
      const id = get(raw, mapping.id);
      url = mapping.avatar_template
        .replace("{id}", id)
        .replace("{avatar}", url);
    }
    if (mapping.avatar_replace) {
      url = url.replace(mapping.avatar_replace.from, mapping.avatar_replace.to);
    }
    return url;
  }

  private async downloadAvatar(userId: string, url: string, provider: string) {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const ext = path.extname(new URL(url).pathname) || ".png";
    const fileName = `${userId}_${provider}${ext}`;
    const filePath = path.join(this.AVATAR_DIR, fileName);
    await fs.mkdir(this.AVATAR_DIR, { recursive: true });
    await fs.writeFile(filePath, res.data);
    return `/uploads/avatars/${fileName}`;
  }

  private async findOrCreateUser(
    providerId: string,
    idpUser: any,
    tokenData: any,
    currentUserId?: string,
  ) {
    const identity = await this.repo.findIdentity(providerId, idpUser.id);
    if (identity)
      return this.repo.findUserById(identity.user_id).then((u) => u!);

    if (currentUserId) {
      console.log("既存ユーザあり、紐づけ:", currentUserId);
      await this.repo.linkIdentity(
        currentUserId,
        providerId,
        idpUser.id,
        tokenData,
      );
      return this.repo.findUserById(currentUserId).then((u) => u!);
    }

    let baseUsername =
      idpUser.username || `user_${Math.random().toString(36).slice(2, 7)}`;
    let username = baseUsername;
    let count = 1;
    while (await this.repo.findUserByUsername(username)) {
      username = `${baseUsername}_${count++}`;
    }

    return this.repo.createUserWithIdentity(
      { username, display_name: idpUser.name || username },
      {
        provider_id: providerId,
        provider_uid: idpUser.id,
        token_data: tokenData,
      },
    );
  }

  async switchAvatar(userId: string, avatarId: string) {
    return this.repo.setSelectedAvatar(userId, avatarId);
  }

  async unlinkService(userId: string, providerName: string) {
    const identityCount = await prisma.user_identities.count({
      where: { user_id: userId },
    });
    if (identityCount <= 1)
      throw new Error("最後の連携手段を解除することはできません。");
    const files = await fs.readdir(this.AVATAR_DIR).catch(() => []);
    const targetFiles = files.filter((f) =>
      f.startsWith(`${userId}_${providerName}`),
    );
    for (const file of targetFiles) {
      await fs.unlink(path.join(this.AVATAR_DIR, file)).catch(() => {});
    }
    return this.repo.deleteIdentityAndAvatar(userId, providerName);
  }

  private async getSamlInstance(providerName: string) {
    const record = await this.repo.findProviderByName(providerName);
    if (!record || record.idp_configurations == null)
      throw new Error("Invalid SAML provider");
    const config = record.idp_configurations.config as any;
    return new SAML({
      // --- 必須・基本設定 ---
      issuer: config.issuer,
      callbackUrl: config.redirect_uri,
      entryPoint: config.entry_point,
      idpCert: this.formatCert(config.cert),

      // --- 詳細設定 (フロントから送信された値を使用) ---
      // 許容する時刻のズレ (秒 -> ミリ秒に変換)
      acceptedClockSkewMs: (config.clockSkewSeconds || 0) * 1000,

      // Requestの有効期限 (ミリ秒)
      requestIdExpirationPeriodMs: config.requestIdExpirationMs || 28800000,

      // 署名の検証設定
      wantAssertionsSigned: config.wantAssertionsSigned ?? true,
      wantAuthnResponseSigned: config.wantAuthnResponseSigned ?? false,

      // AuthnContextの無効化 (Azure AD等で RequestedAuthnContext が原因でエラーになる場合に使用)
      disableRequestedAuthnContext:
        config.disableRequestedAuthnContext ?? false,

      // アルゴリズム系 (デフォルト sha256)
      signatureAlgorithm: config.signature_algorithm || "sha256",
      digestAlgorithm: config.signature_algorithm || "sha256",

      // Identifier Format
      identifierFormat:
        config.identifier_format ||
        "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
    });
  }

  async handleSamlCallback(
    providerName: string,
    body: any,
    fallbackUserId?: string,
  ) {
    // RelayState から state を取得し、保存されていた userId を復元
    const state = body.RelayState;
    const stored = pkceStore.get(state);
    if (!stored) throw new Error("Invalid SAML state (RelayState)");

    const currentUserId = stored.userId || fallbackUserId;
    console.log("Timing handleSamlCallback", currentUserId);
    const saml = await this.getSamlInstance(providerName);
    const { profile } = await saml.validatePostResponseAsync(body);
    if (!profile) throw new Error("SAML verification failed");

    const record = await this.repo.findProviderByName(providerName);
    const config = record!.idp_configurations!.config as any;

    const idpUser = {
      id: String(get(profile, config.mapping?.id) || profile.nameID),
      username: get(profile, config.mapping?.username),
      name: get(profile, config.mapping?.display_name),
    };

    const tokenDataForDb = JSON.parse(JSON.stringify(profile));

    const user = await this.findOrCreateUser(
      record!.id,
      idpUser,
      tokenDataForDb,
      currentUserId,
    );
    pkceStore.delete(state);
    return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
  }

  private formatCert(cert: string): string {
    if (!cert) return "";

    // 1. 全ての改行とスペースを削除して、純粋な Base64 文字列のみを取り出す
    const cleanCert = cert
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s+/g, ""); // 空白、改行、タブをすべて削除

    // 2. 改めて PEM 形式に包み直す (64文字ごとの改行はライブラリがやってくれるので不要な場合が多いですが、念のため)
    return `-----BEGIN CERTIFICATE-----\n${cleanCert}\n-----END CERTIFICATE-----`;
  }
}
