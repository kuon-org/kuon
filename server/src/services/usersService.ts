import * as usersRepo from '../repositories/usersRepository.js';
import { users, local_accounts } from '@prisma/client';
import { TOTP } from "@otplib/totp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import argon2 from 'argon2';
export const getAllUsers = async (): Promise<users[]> => {
  return usersRepo.findAllUsers();
};

export const getUserById = async (userId: string) => {
  const user = await usersRepo.findUserById(userId);
  if (!user) throw new Error("UserNotFound");
  return user;
}

export const getUserByUsername = async (username: string) => {
  const user = await usersRepo.findUserByUsername(username);
  if (!user) throw new Error("UserNotFound");
  return user;
}

/**
 * 新規ユーザ登録（ローカルアカウント含む）
 */
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: users; account: local_accounts }> => {

  const existingUser = await usersRepo.findUserByUsername(username);
  if (existingUser) throw new Error('UsernameAlreadyExists');

  const existingAccount = await usersRepo.findLocalAccountByEmail(email);
  if (existingAccount) throw new Error('EmailAlreadyRegistered');

  return usersRepo.createLocalAccount(username, email, password, displayName);
};

/**
 * ログイン（パスワード検証）
 */
/**
 * ログイン（メールまたはユーザーネーム対応）
 */
export const loginUser = async (
  identifier: string,
  password: string
): Promise<users> => {
  // identifier がメールかユーザーネームかを判定
  const isEmail = identifier.includes('@');
  console.log(isEmail)
  // local_accounts を取得（メール or ユーザーネーム）
  const account = isEmail
    ? await usersRepo.findLocalAccountByEmail(identifier)
    : await usersRepo.findLocalAccountByUsername(identifier);
  console.log(account)
  if (!account || !account.user_id || !account.password_hash) {
    throw new Error('AccountNotFound');
  }

  // パスワード検証
  const isValid = await argon2.verify(account.password_hash, password);
  if (!isValid) {
    throw new Error('InvalidCredentials');
  }

  // ユーザー情報を取得
  const user = await usersRepo.findUserById(account.user_id);
  if (!user) {
    throw new Error('UserNotFound');
  }

  return user;
};


export const updateUserInfo = async (userId: string, displayName: string, bio: string) => {
  const account = await usersRepo.findLocalAccountByUserId(userId);
  if (!account) throw new Error("LocalAccountNotFound");

  // usernameが渡されたときだけユニークチェック


  const data: Record<string, any> = {};
  if (displayName !== undefined) data.display_name = displayName;
  if (bio !== undefined) data.bio = bio;

  return await usersRepo.updateUser(userId, data);
}

export const updateUsername = async (userId: string, username: string) => {
  const account = await usersRepo.findLocalAccountByUserId(userId);
  if (!account) throw new Error("LocalAccountNotFound");
  if (username) {
    const existingUser = await usersRepo.isUsernameExisting(username);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("UsernameAlreadyTaken");
    }
  }
  return await usersRepo.updateUser(userId, { username });
}

export const verifyLogin2FA = async (email: string, token: string) => {
  const account = await usersRepo.findLocalAccountByEmail(email);
  if (!account || !account.user_id) throw new Error("UserNotFound");

  const security = await usersRepo.findUserSecurity(account.user_id);
  if (!security || !security.totp_secret) throw new Error("2FA設定が見つかりません");

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
  const user = await usersRepo.findUserById(account.user_id);
  if (!user) throw new Error("UserNotFound");
  return user;
};


/**
 * パスワード更新
 */
export const changePassword = async (
  userId: string,
  newPassword: string
): Promise<local_accounts> => {
  return usersRepo.updatePassword(userId, newPassword);
};

export const toggleFollow = async (followerId: string, followeeId: string) => {
  const exiting = await usersRepo.isFollowing(followerId, followeeId);
  if (exiting) {
    await usersRepo.unFollowUser(followerId, followeeId);
    return { isFollow: false, message: "フォロー解除しました。" }
  } else {
    await usersRepo.followUser(followerId, followeeId);
    return { isFollow: true, message: "フォローしました！" }
  }
}

export const isFollowing = async (followerId: string, followeeId: string) => {
  const exiting = await usersRepo.isFollowing(followerId, followeeId);
  return { isFollow: exiting };
}

export const getFollowers = async (userId: string) => {
  return await usersRepo.getFollowers(userId);
}

export const getFollowings = async (userId: string) => {
  return await usersRepo.getFollowings(userId);
}

export const get2FASettingValue = async (userId: string) => {
  const user = await usersRepo.findUserById(userId);
  if (!user) throw new Error("UserNotFound");

  const security = await usersRepo.findUserSecurity(userId);
  if (!security) throw new Error("2FA設定が見つかりません");
  return { email: user.email, totp_secret: security.totp_secret };
}


export const getIs2FAEnabled = async (userId: string) => {
  const security = await usersRepo.findUserSecurity(userId);
  return security?.is_2fa_enabled;
}
export const saveTemp2FASecret = async (userId: string, secret: string) => {
  return await usersRepo.update2FASetting(userId, secret);
}

export const save2FASecret = async (userId: string, secret: string) => {
  return await usersRepo.update2FASetting(userId, secret, true);
}

export const getUserRole = async (userId: string) => {
  return await usersRepo.getUserRole(userId);
}

export const getUserIdentities = async (userId: string) => {
  return await usersRepo.getUserIdentities(userId);
}

export const upsertAvatar = async (userId: string,  avatarUrl: string) => {
  return await usersRepo.upsertLocalAvatar(userId, avatarUrl);
}