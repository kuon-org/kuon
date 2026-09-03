import argon2 from "argon2";
import { UsersRepository } from "../repositories/usersRepository.js";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiryDate,
} from "../utils/sessionTokens/index.js";
import crypto from "crypto";
import { ServerSettingsService } from "./serverSettingsService.js";
import { notificationService } from "./notificationService.js";
import { emailVerificationService } from "./emailVerificationService.js";

export class UsersService {
  constructor(
    private usersRepo: UsersRepository,
    private articlesRepo: ArticlesRepository,
    private serverSettingsService: ServerSettingsService,
  ) {}

  async getAllUsers() {
    return await this.usersRepo.findAllUsers();
  }

  async getUserById(userId: string) {
    const user = await this.usersRepo.findUserById(userId);
    if (!user) throw new Error("UserNotFound");
    return user;
  }

  async getUserByUsername(username: string) {
    const user = await this.usersRepo.findUserByUsername(username);
    if (!user) throw new Error("UserNotFound");
    return user;
  }

  async registerUser(
    username: string,
    email: string,
    password: string,
    displayName?: string,
  ) {
    const existing = await this.usersRepo.isUsernameExisting(username);
    if (existing) throw new Error("UsernameAlreadyExists");
    const existingEmail = await this.usersRepo.findLocalAccountByEmail(email);
    if (existingEmail) throw new Error("EmailAlreadyRegistered");

    const isInitialSetup = (await this.usersRepo.findAllUsers()).length === 0;
    const verificationRequired = !isInitialSetup && emailVerificationService.isRequired();

    const result = await this.usersRepo.createLocalAccount(
      username,
      email,
      password,
      displayName,
    );

    let emailSent = false;
    if (verificationRequired) {
      try {
        await emailVerificationService.sendForUser(result.user.id, email, {
          ignoreCooldown: true,
        });
        emailSent = true;
      } catch {
        emailSent = false;
      }
    } else {
      await emailVerificationService.markVerified(result.user.id);
    }

    return { ...result, verificationRequired, emailSent };
  }

  async loginUser(emailOrUsername: string, password: string) {
    let account = await this.usersRepo.findLocalAccountByEmail(emailOrUsername);
    if (!account) {
      account =
        await this.usersRepo.findLocalAccountByUsername(emailOrUsername);
    }
    if (!account || !account.password_hash)
      throw new Error("InvalidCredentials");
    if (!account.user_id) throw new Error("UserNotFound");
    const isValid = await argon2.verify(account.password_hash, password);
    if (!isValid) throw new Error("InvalidCredentials");

    if (emailVerificationService.isRequired() && !account.is_verified) {
      throw new Error("EmailVerificationRequired");
    }

    const user = await this.usersRepo.findUserById(account.user_id);
    if (!user) throw new Error("UserNotFound");
    return user;
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const account = await this.usersRepo.findLocalAccountByUserId(userId);
    if (!account || !account.password_hash) throw new Error("AccountNotFound");

    const isValid = await argon2.verify(account.password_hash, currentPass);
    if (!isValid) throw new Error("InvalidCurrentPassword");

    return await this.usersRepo.updatePassword(userId, newPass);
  }

  async toggleFollow(followerId: string, followeeId: string) {
    const existing = await this.usersRepo.isFollowing(followerId, followeeId);
    if (existing) {
      await this.usersRepo.unFollowUser(followerId, followeeId);
      return { isFollow: false };
    } else {
      await this.usersRepo.followUser(followerId, followeeId);
      void notificationService.userFollowed(followerId, followeeId);
      return { isFollow: true };
    }
  }

  async getIsFollowing(followerId: string, followeeId: string) {
    const isFollow = await this.usersRepo.isFollowing(followerId, followeeId);
    return { isFollow };
  }

  async getFollowers(userId: string) {
    const records = await this.usersRepo.getFollowers(userId);
    return records.map((r) => r.users_user_follows_follower_idTousers);
  }

  async getFollowings(userId: string) {
    const records = await this.usersRepo.getFollowings(userId);
    return records.map((r) => r.users_user_follows_followee_idTousers);
  }

  async updateLastLogin(userId: string) {
    return await this.usersRepo.updateLastLogin(userId);
  }

  async createSessionForUser(
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceName?: string;
    },
  ) {
    await this.usersRepo.deleteExpiredSessionsByUser(userId);
    const refreshToken = createRefreshToken();
    const expiresAt = getRefreshTokenExpiryDate();
    const session = await this.usersRepo.createUserSession(
      userId,
      refreshToken,
      expiresAt,
      metadata,
    );
    return {
      accessToken: createAccessToken(userId, session.id),
      refreshToken,
      refreshExpiresAt: expiresAt,
    };
  }

  async refreshSession(refreshToken: string) {
    const session =
      await this.usersRepo.findSessionByRefreshToken(refreshToken);

    if (!session || session.expires_at < new Date()) {
      throw new Error("InvalidRefreshToken");
    }

    const user = await this.getUserById(session.user_id);

    await this.usersRepo.deleteExpiredSessionsByUser(user.id);

    const newRefreshToken = createRefreshToken();
    const expiresAt = getRefreshTokenExpiryDate();

    await this.usersRepo.updateSessionRefreshToken(
      session.id,
      newRefreshToken,
      expiresAt,
    );

    return {
      accessToken: createAccessToken(user.id, session.id),
      refreshToken: newRefreshToken,
      refreshExpiresAt: expiresAt,
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    return await this.usersRepo.deleteSessionByRefreshToken(refreshToken);
  }

  async getUserSessions(userId: string) {
    return await this.usersRepo.getUserSessions(userId);
  }

  async deleteSessionById(sessionId: string) {
    return await this.usersRepo.deleteSessionById(sessionId);
  }

  async deleteAllSessionsByUser(userId: string) {
    return await this.usersRepo.deleteAllSessionsByUser(userId);
  }

  async getUserRole(userId: string) {
    const role = await this.usersRepo.getUserRole(userId);
    return role?.roles?.name;
  }

  async updateUserInfo(userId: string, displayName: string, bio: string) {
    return await this.usersRepo.updateUser(userId, {
      display_name: displayName,
      bio,
      updated_at: new Date(),
    });
  }

  async updateUsername(userId: string, username: string) {
    return await this.usersRepo.updateUser(userId, {
      username,
      updated_at: new Date(),
    });
  }

  async getUserIdentities(userId: string) {
    return await this.usersRepo.getUserIdentities(userId);
  }

  async updateLocalAvatar(userId: string, pathname: string) {
    return await this.usersRepo.upsertLocalAvatar(userId, pathname);
  }

  async getFollowingTags(userId: string) {
    const result = await this.usersRepo.followingTags(userId);
    const tags = result.map((r) => r.tags);
    return tags;
  }

  async getPickupArticles(userId: string) {
    const data = await this.articlesRepo.findPickupArticles(userId);
    return data.map((item) => item.articles);
  }

  async createPickupArticle(userId: string, articleId: string) {
    const current = await this.articlesRepo.findPickupArticles(userId);
    if (current.length >= 3) throw new Error("ピックアップ記事は3件までです");
    return await this.articlesRepo.createPickupArticle(userId, articleId);
  }

  async deletePickupArticle(userId: string, articleId: string) {
    return await this.articlesRepo.deletePickupArticle(userId, articleId);
  }

  async getUserCommentCount(userId: string) {
    const result = await this.usersRepo.commentCount(userId);
    if (!result) return 0;
    return result._count.comments;
  }

  async getUserArticleCount(userId: string) {
    const result = await this.usersRepo.articleCount(userId);
    if (!result) return 0;
    return result._count.articles;
  }

  async getAllRanking() {
    const users = await this.usersRepo.allRanking();

    return users
      .map((user) => {
        const { _count, ...userData } = user;
        return {
          ...userData,
          contribution: _count.articles + _count.comments,
        };
      })
      .sort((a, b) => b.contribution - a.contribution);
  }

  async getUserApiKeys(userId: string) {
    return await this.usersRepo.findApiKeysByUserId(userId);
  }

  async createApiKey(userId: string, name: string, expiresAt: string | null) {
    if (!this.serverSettingsService.isEnabled(ServerSettingKey.AllowApiKey))
      throw new Error("ApiKeyGenerationDisabled");

    const rawKey = `ku_${crypto.randomBytes(32).toString("hex")}`;
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const prefix = rawKey.substring(0, 7);

    const expiryDate = expiresAt ? new Date(expiresAt) : null;

    const apiKey = await this.usersRepo.createApiKey({
      user_id: userId,
      name,
      api_key_hash: hash,
      prefix,
      expires_at: expiryDate,
      created_by: userId,
    });

    return { ...apiKey, rawKey };
  }

  async revokeApiKey(userId: string, apiKeyId: string) {
    return await this.usersRepo.deleteApiKey(apiKeyId, userId);
  }
}
