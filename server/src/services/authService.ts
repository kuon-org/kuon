import * as pkce from "pkce-challenge";
import { createRemoteJWKSet, jwtVerify } from "jose";
import fs from "node:fs/promises";
import path from "node:path";
import { get } from "lodash-es";
import { AuthRepository } from "../repositories/authRepository.js";
import prisma from "../prisma/client.js";
import { SAML } from "@node-saml/node-saml";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiryDate,
} from "../utils/sessionTokens/index.js";

const pkceStore = new Map<
  string,
  { verifier: string; userId?: string; nonce?: string }
>();

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
    const nonce =
      record.provider_type?.toUpperCase() === "OIDC"
        ? crypto.randomUUID()
        : undefined;

    pkceStore.set(state, {
      verifier: code_verifier,
      userId: currentUserId,
      nonce,
    });
    if (record.provider_type === "SAML") {
      const saml = await this.getSamlInstance(providerName);
      const authUrl = await saml.getAuthorizeUrlAsync(state, undefined, {});
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
    if (nonce) url.searchParams.set("nonce", nonce);

    return { url: url.toString() };
  }

  async handleCallback(
    providerName: string,
    code: string,
    state: string,
    fallbackUserId?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceName?: string;
    },
  ) {
    const stored = pkceStore.get(state);
    if (!stored) throw new Error("Invalid state");

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
      rawUserInfo = await this.verifyOidcIdToken(
        tokenData.id_token,
        config,
        stored.nonce,
      );
    } else {
      const res = await fetch(config.user_info_url, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch user info: ${res.status}`);
      }
      const data = await res.json();
      rawUserInfo = data;
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
    return await this.createUserSession(user.id, metadata);
  }

  private async verifyOidcIdToken(
    idToken: string,
    config: any,
    nonce?: string,
  ) {
    const issuer = String(config.issuer_host || "").replace(/\/$/, "");
    if (!issuer) throw new Error("OIDC issuer is not configured");
    if (!config.client_id) throw new Error("OIDC client_id is not configured");
    if (!nonce) throw new Error("OIDC nonce is missing");

    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl);
    if (!response.ok) {
      throw new Error(`OIDC discovery request failed: ${response.status}`);
    }

    const metadata = (await response.json()) as {
      issuer?: string;
      jwks_uri?: string;
    };
    if (!metadata.issuer || !metadata.jwks_uri) {
      throw new Error("OIDC discovery metadata is incomplete");
    }

    const discoveredIssuer = metadata.issuer.replace(/\/$/, "");
    if (discoveredIssuer !== issuer) {
      throw new Error("OIDC issuer mismatch");
    }

    const jwksUri = new URL(metadata.jwks_uri);
    const remoteJwks = createRemoteJWKSet(jwksUri);

    const { payload } = await jwtVerify(idToken, remoteJwks, {
      issuer: metadata.issuer,
      audience: config.client_id,
      requiredClaims: ["iss", "sub", "aud", "exp", "iat", "nonce"],
    });

    if (payload.nonce !== nonce) {
      throw new Error("OIDC nonce mismatch");
    }

    return payload;
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
      const basicAuth = Buffer.from(
        `${config.client_id}:${config.client_secret}`,
      ).toString("base64");
      headers["Authorization"] = `Basic ${basicAuth}`;
      params.set("client_id", config.client_id);
    } else {
      params.set("client_id", config.client_id);
      params.set("client_secret", config.client_secret);
    }

    const res = await fetch(config.token_url, {
      method: "POST",
      headers,
      body: params.toString(),
    });
    if (!res.ok) {
      throw new Error(`Token endpoint returned ${res.status}`);
    }
    return await res.json();
  }

  private async createUserSession(
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceName?: string;
    },
  ) {
    await prisma.user_sessions.deleteMany({
      where: {
        user_id: userId,
        expires_at: { lt: new Date() },
      },
    });

    const refreshToken = createRefreshToken();
    const expiresAt = getRefreshTokenExpiryDate();

    const session = await prisma.user_sessions.create({
      data: {
        user_id: userId,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
        device_name: metadata?.deviceName,
      },
    });

    return {
      accessToken: createAccessToken(userId, session.id),
      refreshToken,
      refreshExpiresAt: expiresAt,
    };
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
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download avatar: ${res.status}`);
    }
    const ext = path.extname(new URL(url).pathname) || ".png";
    const fileName = `${userId}_${provider}${ext}`;
    const filePath = path.join(this.AVATAR_DIR, fileName);
    await fs.mkdir(this.AVATAR_DIR, { recursive: true });
    await fs.writeFile(filePath, Buffer.from(await res.arrayBuffer()));
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
      issuer: config.issuer,
      callbackUrl: config.redirect_uri,
      entryPoint: config.entry_point,
      idpCert: this.formatCert(config.cert),
      acceptedClockSkewMs: (config.clockSkewSeconds || 0) * 1000,
      requestIdExpirationPeriodMs: config.requestIdExpirationMs || 28800000,
      wantAssertionsSigned: config.wantAssertionsSigned ?? true,
      wantAuthnResponseSigned: config.wantAuthnResponseSigned ?? false,
      disableRequestedAuthnContext:
        config.disableRequestedAuthnContext ?? false,
      signatureAlgorithm: config.signature_algorithm || "sha256",
      digestAlgorithm: config.signature_algorithm || "sha256",
      identifierFormat:
        config.identifier_format ||
        "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
    });
  }

  async handleSamlCallback(
    providerName: string,
    body: any,
    fallbackUserId?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceName?: string;
    },
  ) {
    const state = body.RelayState;
    const stored = pkceStore.get(state);
    if (!stored) throw new Error("Invalid SAML state (RelayState)");

    const currentUserId = stored.userId || fallbackUserId;
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
    return await this.createUserSession(user.id, metadata);
  }

  private formatCert(cert: string): string {
    if (!cert) return "";

    const cleanCert = cert
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s+/g, "");

    return `-----BEGIN CERTIFICATE-----\n${cleanCert}\n-----END CERTIFICATE-----`;
  }
}
