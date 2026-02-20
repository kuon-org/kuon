// repositories/usersRepository.ts
import prisma from '../prisma/client.js';
import { users, local_accounts, user_security } from '@prisma/client';
import argon2 from 'argon2';
import { UUID } from '../utils/uuid/index.js';

//
// --- users
//

export const findAllUsers = async (): Promise<users[]> => {
    return prisma.users.findMany();
};

export const findUserById = async (userId: string): Promise<users | null> => {
    return prisma.users.findUnique({
        where: { id: userId },
    });
};

export const findUserByUsername = async (username: string): Promise<users | null> => {
    return prisma.users.findFirst({
        where: { username },
    });
};

export const createUser = async (id: UUID, username: string, email: string, displayName?: string): Promise<users> => {
    return prisma.users.create({
        data: {
            id,
            username,
            email,
            display_name: displayName ?? username,
        },
    });
};

//
// --- local_accounts
//

export const findLocalAccountByEmail = async (email: string): Promise<local_accounts | null> => {
    return prisma.local_accounts.findFirst({
        where: { email },
    });
};

export const findLocalAccountByUsername = async (username: string): Promise<local_accounts | null> => {
    return prisma.local_accounts.findFirst({
        where: { users: { username } }
    })
}

export const findLocalAccountByUserId = async (userId: string): Promise<local_accounts | null> => {
    return prisma.local_accounts.findFirst({
        where: { user_id: userId },
    });
};

/**
 * ローカルアカウント作成
 * users テーブルも同時に作成する
 */
export const createLocalAccount = async (
    username: string,
    email: string,
    password: string,
    displayName?: string
): Promise<{ user: users; account: local_accounts }> => {
    // パスワードをargon2でハッシュ化
    const passwordHash = await argon2.hash(password);

    // トランザクションで両方作成
    return prisma.$transaction(async (tx) => {
        const userCount = await tx.users.count();
        const user = await tx.users.create({
            data: {
                username,
                email,
                display_name: displayName ?? username,
            },
        });

        const account = await tx.local_accounts.create({
            data: {
                user_id: user.id,
                email,
                password_hash: passwordHash,
                is_verified: false,
            },
        });
        const security = await tx.user_security.create({
            data: {
                user_id: user.id,
                is_2fa_enabled: false,
            },
        });
        const roleName = userCount === 0 ? 'admin' : 'general';
        const role = await tx.user_roles.create({
            data: {
                users: {
                    connect: { id: user.id }, // user_id に紐づけ
                },
                roles: {
                    connect: { name: roleName }, // name='general' の role を自動で探して role_id に設定
                },
            },
        });

        return { user, account, security, role };
    });
};




/**
 * パスワード検証
 * サービスで処理するため廃止
 * @deprecated
 */
export const verifyPassword = async (email: string, plainPassword: string): Promise<boolean> => {
    const account = await findLocalAccountByEmail(email);
    if (!account || !account.password_hash) return false;
    return argon2.verify(account.password_hash, plainPassword);
};

/**
 * パスワード更新
 */
export const updatePassword = async (userId: string, newPassword: string): Promise<local_accounts> => {
    const account = await findLocalAccountByUserId(userId);
    if (!account) throw new Error("LocalAccountNotFound");

    const passwordHash = await argon2.hash(newPassword);

    return prisma.local_accounts.update({
        where: { id: account.id },
        data: { password_hash: passwordHash },
    });
};

export const isUsernameExisting = async (username: string) => {
    return prisma.users.findUnique({
        where: { username }
    })
}
export const updateUser = async (userId: string, data: any) => {
    return prisma.users.update({
        where: { id: userId },
        data,
    });
};



/**
 * セキュリティ設定取得
 */
export const findUserSecurity = async (userId: string): Promise<user_security | null> => {
    return prisma.user_security.findUnique({
        where: { user_id: userId },
    });
};
/**
 * 2FA設定の更新
 */
export const update2FASetting = async (
    userId: string,
    secret: string,
    isEnabled?: boolean
): Promise<user_security> => {
    return prisma.user_security.upsert({
        where: { user_id: userId },
        update: {
            totp_secret: secret,
            is_2fa_enabled: isEnabled ?? false,
        },
        create: {
            user_id: userId,
            totp_secret: secret,
            is_2fa_enabled: isEnabled ?? false,
        },
    });
};

export const followUser = async (followerId: string, followeeId: string) => {
    return prisma.user_follows.create({
        data: {
            follower_id: followerId,
            followee_id: followeeId
        },
    });
}

export const unFollowUser = async (followerId: string, followeeId: string) => {
    return prisma.user_follows.delete({
        where: {
            follower_id_followee_id: {
                follower_id: followerId,
                followee_id: followeeId,
            },
        },
    });
}

export const isFollowing = async (followerId: string, followeeId: string) => {
    const follow = await prisma.user_follows.findUnique({
        where: {
            follower_id_followee_id: {
                follower_id: followerId,
                followee_id: followeeId,
            },
        },
    });
    return !!follow;
}

export const getFollowers = async (userId: string) => {
    return prisma.user_follows.findMany({
        where: { followee_id: userId },
        select: {
            users_user_follows_follower_idTousers: {
                select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                    bio: true,

                }
            }
        }
    });
}

export const getFollowings = async (userId: string) => {
    return prisma.user_follows.findMany({
        where: { follower_id: userId },
        select: {
            users_user_follows_followee_idTousers: {
                select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                    bio: true,
                }
            }
        }
    });
}

export const getUserRole = async (userId: string) => {
    return prisma.user_roles.findFirst({
        where: { user_id: userId },
        select: {
            roles: {
                select: {
                    name: true
                }
            }
        }
    })
}

export const getUserIdentities = async (userId: string) => {
    return prisma.users.findUnique({
        where: { id: userId },
        include: {
            // user_identities テーブルのリレーション名（通常はモデル名と同じ）
            user_identities: {
                select: {
                    id: true,
                    provider_id: true,
                    provider_uid: true,
                    linked_at: true,
                    // provider名を表示したい場合はさらにIdP情報を結合
                    identity_providers: {
                        select: {
                            display_name: true,
                            provider_name: true,
                            logo_url: true
                        }
                    }
                }
            },
            // user_avatars テーブルの情報
            user_avatars: {
                orderBy: {
                    updated_at: 'desc' // 新しい順に並べる
                },
                select: {
                    id: true,
                    service_name: true,
                    avatar_url: true,
                    is_selected: true,
                    updated_at: true
                }
            }
        }
    });
}

export const upsertLocalAvatar = async (userId: string, avatarUrl: string) => {
  return prisma.$transaction(async (tx) => {
    // 1. 必要な情報を並列で取得
    const [currentSelected, existingLocal] = await Promise.all([
      tx.user_avatars.findFirst({
        where: { user_id: userId, is_selected: true },
        include: { users: { select: { avatar_url: true } } }
      }),
      tx.user_avatars.findFirst({
        where: { user_id: userId, service_name: "local" }
      })
    ]);

    // 2. 選択フラグの判定
    // 「現在選択されているものがない」または「ユーザーテーブルのURLが空」の場合、この画像をメインにする
    const shouldSelect = !currentSelected || !currentSelected.users.avatar_url;

    // 3. user_avatars の更新または作成
    let updatedAvatar;
    if (existingLocal) {
      updatedAvatar = await tx.user_avatars.update({
        where: { id: existingLocal.id },
        data: {
          avatar_url: avatarUrl,
          source_url: avatarUrl,
          updated_at: new Date(),
          ...(shouldSelect && { is_selected: true })
        }
      });
    } else {
      updatedAvatar = await tx.user_avatars.create({
        data: {
          user_id: userId,
          service_name: "local",
          avatar_url: avatarUrl,
          source_url: avatarUrl,
          is_selected: shouldSelect
        }
      });
    }

    // 4. ユーザーテーブルの avatar_url を更新
    // 今回の画像が選択状態(is_selected: true)になる場合のみ、ユーザー本体のURLも同期する
    if (shouldSelect) {
      await tx.users.update({
        where: { id: userId },
        data: {
          avatar_url: avatarUrl,
          updated_at: new Date()
        }
      });
    }

    return updatedAvatar;
  });
};