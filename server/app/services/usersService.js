import argon2 from 'argon2';
import ScureBase32Plugin from '@otplib/plugin-base32-scure';
import NodeCryptoPlugin from '@otplib/plugin-crypto-node';
import { TOTP } from '@otplib/totp';
export class UsersService {
    constructor(usersRepo) {
        this.usersRepo = usersRepo;
    }
    async getAllUsers() {
        return await this.usersRepo.findAllUsers();
    }
    async getUserById(userId) {
        const user = await this.usersRepo.findUserById(userId);
        if (!user)
            throw new Error("UserNotFound");
        return user;
    }
    async getUserByUsername(username) {
        const user = await this.usersRepo.findUserByUsername(username);
        if (!user)
            throw new Error("UserNotFound");
        return user;
    }
    async registerUser(username, email, password, displayName) {
        // バリデーション
        const existing = await this.usersRepo.isUsernameExisting(username);
        if (existing)
            throw new Error("UsernameAlreadyExists");
        // Repository側のトランザクションメソッドを呼び出し
        return await this.usersRepo.createLocalAccount(username, email, password, displayName);
    }
    async loginUser(emailOrUsername, password) {
        let account = await this.usersRepo.findLocalAccountByEmail(emailOrUsername);
        if (!account) {
            account = await this.usersRepo.findLocalAccountByUsername(emailOrUsername);
        }
        if (!account || !account.password_hash)
            throw new Error('InvalidCredentials');
        if (!account.user_id)
            throw new Error('UserNotFound');
        const isValid = await argon2.verify(account.password_hash, password);
        if (!isValid)
            throw new Error('InvalidCredentials');
        const user = await this.usersRepo.findUserById(account.user_id);
        if (!user)
            throw new Error('UserNotFound');
        return user;
    }
    async changePassword(userId, currentPass, newPass) {
        const account = await this.usersRepo.findLocalAccountByUserId(userId);
        if (!account || !account.password_hash)
            throw new Error("AccountNotFound");
        const isValid = await argon2.verify(account.password_hash, currentPass);
        if (!isValid)
            throw new Error("InvalidCurrentPassword");
        return await this.usersRepo.updatePassword(userId, newPass);
    }
    async toggleFollow(followerId, followeeId) {
        const existing = await this.usersRepo.isFollowing(followerId, followeeId);
        if (existing) {
            await this.usersRepo.unFollowUser(followerId, followeeId);
            return { isFollow: false };
        }
        else {
            await this.usersRepo.followUser(followerId, followeeId);
            return { isFollow: true };
        }
    }
    async getIsFollowing(followerId, followeeId) {
        const isFollow = await this.usersRepo.isFollowing(followerId, followeeId);
        return { isFollow };
    }
    async getFollowers(userId) {
        const records = await this.usersRepo.getFollowers(userId);
        return records.map(r => r.users_user_follows_follower_idTousers);
    }
    async getFollowings(userId) {
        const records = await this.usersRepo.getFollowings(userId);
        return records.map(r => r.users_user_follows_followee_idTousers);
    }
    async get2FASettingValue(userId) {
        const user = await this.usersRepo.findUserById(userId);
        const security = await this.usersRepo.findUserSecurity(userId);
        if (!user || !security)
            throw new Error("2FA設定が見つかりません");
        return { email: user.email, totp_secret: security.totp_secret };
    }
    async getIs2FAEnabled(userId) {
        const security = await this.usersRepo.findUserSecurity(userId);
        return security?.is_2fa_enabled;
    }
    async saveTemp2FASecret(userId, secret) {
        return await this.usersRepo.update2FASetting(userId, secret);
    }
    async verifyLogin2FA(email, token) {
        const account = await this.usersRepo.findLocalAccountByEmail(email);
        if (!account || !account.user_id)
            throw new Error("UserNotFound");
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
        if (!user)
            throw new Error("UserNotFound");
        return user;
    }
    ;
    async updateLastLogin(userId) {
        return await this.usersRepo.updateLastLogin(userId);
    }
    async save2FASecret(userId, secret) {
        return await this.usersRepo.update2FASetting(userId, secret, true);
    }
    async delete2FASettings(userId) {
        return await this.usersRepo.delete2FASetting(userId);
    }
    async getUserRole(userId) {
        const role = await this.usersRepo.getUserRole(userId);
        return role?.roles?.name;
    }
    async updateUserInfo(userId, displayName, bio) {
        return await this.usersRepo.updateUser(userId, { display_name: displayName, bio, updated_at: new Date() });
    }
    async updateUsername(userId, username) {
        return await this.usersRepo.updateUser(userId, { username, updated_at: new Date() });
    }
    async getUserIdentities(userId) {
        return await this.usersRepo.getUserIdentities(userId);
    }
    async updateLocalAvatar(userId, pathname) {
        return await this.usersRepo.upsertLocalAvatar(userId, pathname);
    }
}
