// src/repositories/authRepository.ts
import prisma from "../prisma/client.js";

export class AuthRepository {
    async findProviderByName(name: string) {
        return prisma.identity_providers.findFirst({
            where: { provider_name: name },
            include: { idp_configurations: true },
        });
    }

    async findIdentity(providerId: string, providerUid: string) {
        return prisma.user_identities.findFirst({
            where: { provider_id: providerId, provider_uid: providerUid },
        });
    }

    async findUserById(userId: string) {
        return prisma.users.findUnique({ where: { id: userId } });
    }

    async findUserByUsername(username: string) {
        return prisma.users.findUnique({ where: { username } });
    }

    /**
     * 既存ユーザーに新しい外部サービスを紐付ける
     */
    async linkIdentity(userId: string, providerId: string, providerUid: string, tokenData: any) {
        return prisma.user_identities.create({
            data: {
                user_id: userId,
                provider_id: providerId,
                provider_uid: providerUid,
                token_data: tokenData, // JSONBにそのまま保存
            }
        });
    }

    /**
     * 初回ログイン時にユーザーと連携情報を同時に作成
     */
    async createUserWithIdentity(userData: { username: string, display_name: string }, identityData: { provider_id: string, provider_uid: string, token_data: any }) {
        return prisma.$transaction(async (tx) => {
            const user = await tx.users.create({ data: userData });
            await tx.user_identities.create({
                data: {
                    user_id: user.id,
                    provider_id: identityData.provider_id,
                    provider_uid: identityData.provider_uid,
                    token_data: identityData.token_data, // JSONBにそのまま保存
                }
            });
            await tx.user_roles.create({
                data: {
                    users: { connect: { id: user.id } },
                    roles: { connect: { name: "general" } }
                }
            })
            return user;
        });
    }

    async upsertAvatar(tx: any, data: { userId: string, serviceName: string, avatarUrl: string, sourceUrl: string, isSelected: boolean }) {
        const existing = await tx.user_avatars.findFirst({
            where: { user_id: data.userId, service_name: data.serviceName }
        });

        if (existing) {
            return tx.user_avatars.update({
                where: { id: existing.id },
                data: {
                    avatar_url: data.avatarUrl,
                    source_url: data.sourceUrl,
                    is_selected: data.isSelected,
                    updated_at: new Date()
                }
            });
        }
        return tx.user_avatars.create({
            data: {
                user_id: data.userId,
                service_name: data.serviceName,
                avatar_url: data.avatarUrl,
                source_url: data.sourceUrl,
                is_selected: data.isSelected
            }
        });
    }

    async updateLastLogin(userId: string) {
        return prisma.users.update({
            where: { id: userId },
            data: { last_login_at: new Date() }
        });
    }

    async setSelectedAvatar(userId: string, avatarId: string) {
        return prisma.$transaction(async (tx) => {
            await tx.user_avatars.updateMany({
                where: { user_id: userId },
                data: { is_selected: false }
            });
            const selected = await tx.user_avatars.update({
                where: { id: avatarId, user_id: userId },
                data: { is_selected: true }
            });
            await tx.users.update({
                where: { id: userId },
                data: { avatar_url: selected.avatar_url }
            });
            return selected;
        });
    }

    async deleteIdentityAndAvatar(userId: string, providerName: string) {
        const provider = await this.findProviderByName(providerName);
        if (!provider) throw new Error("Provider not found");

        return prisma.$transaction(async (tx) => {
            await tx.user_identities.deleteMany({
                where: { user_id: userId, provider_id: provider.id }
            });
            await tx.user_avatars.deleteMany({
                where: { user_id: userId, service_name: providerName }
            });
            const user = await tx.users.findUnique({ where: { id: userId } });
            if (user?.avatar_url?.includes(`_${providerName}`)) {
                await tx.users.update({
                    where: { id: userId },
                    data: { avatar_url: null }
                });
            }
        });
    }
}