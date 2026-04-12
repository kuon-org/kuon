import argon2 from "argon2";
import { UsersRepository } from "../repositories/usersRepository.js";
import ScureBase32Plugin from "@otplib/plugin-base32-scure";
import NodeCryptoPlugin from "@otplib/plugin-crypto-node";
import { TOTP } from "@otplib/totp";
import { ArticlesRepository } from "../repositories/articlesRepository.js";
export class UsersService {
  constructor(
    private usersRepo: UsersRepository,
    private articlesRepo: ArticlesRepository,
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
    // バリデーション
    const existing = await this.usersRepo.isUsernameExisting(username);
    if (existing) throw new Error("UsernameAlreadyExists");

    // Repository側のトランザクションメソッドを呼び出し
    return await this.usersRepo.createLocalAccount(
      username,
      email,
      password,
      displayName,
    );
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

  async get2FASettingValue(userId: string) {
    const user = await this.usersRepo.findUserById(userId);
    const security = await this.usersRepo.findUserSecurity(userId);
    return { email: user?.email, totp_secret: security?.totp_secret };
  }

  async getIs2FAEnabled(userId: string) {
    const security = await this.usersRepo.findUserSecurity(userId);
    return security?.is_2fa_enabled;
  }

  async saveTemp2FASecret(userId: string, secret: string) {
    return await this.usersRepo.update2FASetting(userId, secret);
  }
  async verifyLogin2FA(email: string, token: string) {
    const account = await this.usersRepo.findLocalAccountByEmail(email);
    if (!account || !account.user_id) throw new Error("UserNotFound");

    const security = await this.usersRepo.findUserSecurity(account.user_id);
    if (!security || !security.totp_secret)
      throw new Error("2FA設定が見つかりません");

    const totp = new TOTP({
      crypto: new NodeCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });

    // 🔍 デバッグ（残してもOK）
    console.log("---- 2FA Debug ----");
    console.log("Email:", email);
    console.log("Token (入力):", token);
    console.log("Secret (DB):", security.totp_secret);

    const result = await totp.verify(token, { secret: security.totp_secret });
    console.log("Result (verifyLogin2FA):", result);
    console.log("-------------------");

    // ✅ 修正箇所：result.valid を見る！
    if (!result.valid) {
      throw new Error("認証コードが正しくありません");
    }
    const user = await this.usersRepo.findUserById(account.user_id);
    if (!user) throw new Error("UserNotFound");
    return user;
  }

  async updateLastLogin(userId: string) {
    return await this.usersRepo.updateLastLogin(userId);
  }
  async save2FASecret(userId: string, secret: string) {
    return await this.usersRepo.update2FASetting(userId, secret, true);
  }

  async delete2FASettings(userId: string) {
    return await this.usersRepo.delete2FASetting(userId);
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
    // dataが [{ articles: {...} }, { articles: {...} }] になっているので展開する
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

    return (
      users
        .map((user) => {
          const { _count, ...userData } = user;
          return {
            ...userData,
            contribution: _count.articles + _count.comments,
          };
        })
        // 合計値の降順でソート
        .sort((a, b) => b.contribution - a.contribution)
    );
  }
}
