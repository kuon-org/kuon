import prisma from "../prisma/client.js";
import argon2 from "argon2";
export class UsersRepository {
    // --- users ---
    async findAllUsers() {
        return prisma.users.findMany();
    }
    async findUserById(userId) {
        return prisma.users.findUnique({ where: { id: userId } });
    }
    async findUserByUsername(username) {
        return prisma.users.findFirst({ where: { username } });
    }
    async createUser(id, username, email, displayName) {
        return prisma.users.create({
            data: {
                id,
                username,
                email,
                display_name: displayName ?? username,
            },
        });
    }
    async isUsernameExisting(username) {
        return prisma.users.findUnique({ where: { username } });
    }
    async updateUser(userId, data) {
        return prisma.users.update({
            where: { id: userId },
            data,
        });
    }
    // --- local_accounts ---
    async findLocalAccountByEmail(email) {
        return prisma.local_accounts.findFirst({ where: { email } });
    }
    async findLocalAccountByUsername(username) {
        return prisma.local_accounts.findFirst({
            where: { users: { username } },
        });
    }
    async findLocalAccountByUserId(userId) {
        return prisma.local_accounts.findFirst({ where: { user_id: userId } });
    }
    async createLocalAccount(username, email, password, displayName) {
        const passwordHash = await argon2.hash(password);
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
            const roleName = userCount === 0 ? "admin" : "general";
            const role = await tx.user_roles.create({
                data: {
                    users: { connect: { id: user.id } },
                    roles: { connect: { name: roleName } },
                },
            });
            await tx.stock_lists.create({
                data: {
                    user_id: user.id,
                    name: "あとで読む",
                    is_system: true,
                    is_default: true,
                    visibility: "private",
                },
            });
            return { user, account, security, role };
        });
    }
    async updatePassword(userId, newPassword) {
        const account = await this.findLocalAccountByUserId(userId);
        if (!account)
            throw new Error("LocalAccountNotFound");
        const passwordHash = await argon2.hash(newPassword);
        return prisma.local_accounts.update({
            where: { id: account.id },
            data: { password_hash: passwordHash },
        });
    }
    async createUserSession(userId, refreshToken, expiresAt, metadata) {
        return prisma.user_sessions.create({
            data: {
                user_id: userId,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                ip_address: metadata?.ipAddress,
                user_agent: metadata?.userAgent,
                device_name: metadata?.deviceName,
            },
        });
    }
    async updateSessionRefreshToken(sessionId, refreshToken, expiresAt) {
        return await prisma.user_sessions.update({
            where: { id: sessionId },
            data: {
                refresh_token: refreshToken,
                expires_at: expiresAt,
            },
        });
    }
    async deleteExpiredSessionsByUser(userId) {
        return prisma.user_sessions.deleteMany({
            where: {
                user_id: userId,
                expires_at: { lt: new Date() },
            },
        });
    }
    async findSessionByRefreshToken(refreshToken) {
        return prisma.user_sessions.findUnique({
            where: { refresh_token: refreshToken },
        });
    }
    async deleteSessionByRefreshToken(refreshToken) {
        return prisma.user_sessions.deleteMany({
            where: { refresh_token: refreshToken },
        });
    }
    async getUserSessions(userId) {
        return prisma.user_sessions.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
        });
    }
    async deleteSessionById(sessionId) {
        return prisma.user_sessions.delete({
            where: { id: sessionId },
        });
    }
    async deleteAllSessionsByUser(userId) {
        return prisma.user_sessions.deleteMany({
            where: { user_id: userId },
        });
    }
    // --- security ---
    async findUserSecurity(userId) {
        return prisma.user_security.findUnique({ where: { user_id: userId } });
    }
    async update2FASetting(userId, secret, isEnabled) {
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
    }
    async delete2FASetting(userId) {
        return prisma.user_security.update({
            where: { user_id: userId },
            data: {
                totp_secret: null,
                is_2fa_enabled: false,
            },
        });
    }
    // --- follows ---
    async followUser(followerId, followeeId) {
        return prisma.user_follows.create({
            data: { follower_id: followerId, followee_id: followeeId },
        });
    }
    async unFollowUser(followerId, followeeId) {
        return prisma.user_follows.delete({
            where: {
                follower_id_followee_id: {
                    follower_id: followerId,
                    followee_id: followeeId,
                },
            },
        });
    }
    async isFollowing(followerId, followeeId) {
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
    async getFollowers(userId) {
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
                    },
                },
            },
        });
    }
    async getFollowings(userId) {
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
                    },
                },
            },
        });
    }
    // --- roles / identities ---
    async getUserRole(userId) {
        return prisma.user_roles.findFirst({
            where: { user_id: userId },
            select: {
                roles: { select: { name: true } },
            },
        });
    }
    async getUserIdentities(userId) {
        return prisma.users.findUnique({
            where: { id: userId },
            include: {
                user_identities: {
                    select: {
                        id: true,
                        provider_id: true,
                        provider_uid: true,
                        linked_at: true,
                        identity_providers: {
                            select: {
                                display_name: true,
                                provider_name: true,
                                logo_url: true,
                            },
                        },
                    },
                },
                user_avatars: {
                    orderBy: { updated_at: "desc" },
                    select: {
                        id: true,
                        service_name: true,
                        avatar_url: true,
                        is_selected: true,
                        updated_at: true,
                    },
                },
            },
        });
    }
    // --- avatar ---
    async upsertLocalAvatar(userId, avatarUrl) {
        return prisma.$transaction(async (tx) => {
            const [currentSelected, existingLocal] = await Promise.all([
                tx.user_avatars.findFirst({
                    where: { user_id: userId, is_selected: true },
                    include: { users: { select: { avatar_url: true } } },
                }),
                tx.user_avatars.findFirst({
                    where: { user_id: userId, service_name: "local" },
                }),
            ]);
            const shouldSelect = !currentSelected || !currentSelected.users.avatar_url;
            let updatedAvatar;
            if (existingLocal) {
                updatedAvatar = await tx.user_avatars.update({
                    where: { id: existingLocal.id },
                    data: {
                        avatar_url: avatarUrl,
                        source_url: avatarUrl,
                        updated_at: new Date(),
                        ...(shouldSelect && { is_selected: true }),
                    },
                });
            }
            else {
                updatedAvatar = await tx.user_avatars.create({
                    data: {
                        user_id: userId,
                        service_name: "local",
                        avatar_url: avatarUrl,
                        source_url: avatarUrl,
                        is_selected: shouldSelect,
                    },
                });
            }
            if (shouldSelect) {
                await tx.users.update({
                    where: { id: userId },
                    data: {
                        avatar_url: avatarUrl,
                        updated_at: new Date(),
                    },
                });
            }
            return updatedAvatar;
        });
    }
    async isAdmin(userId) {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: {
                user_roles: {
                    include: { roles: true },
                },
            },
        });
        if (!user)
            return false;
        return user.user_roles.some((ur) => !!ur.roles && ur.roles.name === "admin");
    }
    async updateLastLogin(userId) {
        return await prisma.users.update({
            where: { id: userId },
            data: { last_login_at: new Date() },
        });
    }
    async followingTags(userId) {
        return await prisma.tag_follows.findMany({
            where: { user_id: userId },
            include: {
                tags: true,
            },
        });
    }
    async commentCount(userId) {
        return await prisma.users.findUnique({
            where: { id: userId },
            select: {
                _count: {
                    select: {
                        comments: {
                            where: { is_deleted: false },
                        },
                    },
                },
            },
        });
    }
    async articleCount(userId) {
        return await prisma.users.findUnique({
            where: { id: userId },
            select: {
                _count: {
                    select: {
                        articles: {
                            where: {
                                is_deleted: false,
                                is_published: true,
                                is_private: false,
                            },
                        },
                    },
                },
            },
        });
    }
    async allRanking() {
        return await prisma.users.findMany({
            where: {
                is_active: true, // アクティブなユーザーのみ
            },
            select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
                _count: {
                    select: {
                        articles: {
                            where: {
                                is_deleted: false,
                                is_published: true,
                                is_private: false,
                            },
                        },
                        comments: { where: { is_deleted: false } },
                    },
                },
            },
            take: 10, // 上位10名
        });
    }
    // --- api_keys ---
    /**
     * ユーザーに紐づくAPIキー一覧を取得する
     */
    async findApiKeysByUserId(userId) {
        return prisma.user_api_keys.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
        });
    }
    /**
     * 新しいAPIキーを保存する
     */
    async createApiKey(data) {
        return prisma.user_api_keys.create({
            data,
        });
    }
    /**
     * APIキーを削除（無効化）する
     */
    async deleteApiKey(id, userId) {
        return prisma.user_api_keys.delete({
            where: { id, user_id: userId },
        });
    }
}
