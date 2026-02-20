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

    async findAvatarByService(userId: string, serviceName: string) {
        return prisma.user_avatars.findFirst({
            where: { user_id: userId, service_name: serviceName }
        });
    }

    async upsertAvatar(tx: any, data: { userId: string, serviceName: string, avatarUrl: string, sourceUrl: string, isSelected: boolean }) {
        const existing = await tx.user_avatars.findFirst({
            where: {
                user_id: data.userId,
                service_name: data.serviceName
            }
        });

        if (existing) {
            return tx.user_avatars.update({
                where: { id: existing.id },
                data: {
                    avatar_url: data.avatarUrl,
                    source_url: data.sourceUrl,
                    updated_at: new Date()
                }
            });
        }

        // data をそのまま渡さず、DBのカラム名(スネークケース)にマッピングして渡す
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

    async setSelectedAvatar(userId: string, avatarId: string) {
        return prisma.$transaction(async (tx) => {
            // 1. そのユーザーのアバターを全部 false にリセット
            await tx.user_avatars.updateMany({
                where: { user_id: userId },
                data: { is_selected: false }
            });

            // 2. 指定したアバターだけ true にする
            const selected = await tx.user_avatars.update({
                where: { id: avatarId, user_id: userId },
                data: { is_selected: true }
            });

            // 3. users テーブルに反映
            await tx.users.update({
                where: { id: userId },
                data: {
                    avatar_url: selected.avatar_url,
                    updated_at: new Date()
                }
            });

            return selected;
        });
    }

    async createUserWithIdentity(userData: any, identityData: any) {
        return prisma.$transaction(async (tx) => {
            // identityDataのキー名もDBに合わせて展開して渡すのが安全
            const user = await tx.users.create({ data: userData });
            await tx.user_identities.create({
                data: {
                    user_id: user.id,
                    provider_id: identityData.provider_id,
                    provider_uid: identityData.provider_uid,
                    token_data: identityData.token_data
                }
            });
            return user;
        });
    }

    // src/repositories/authRepository.ts

    async deleteIdentityAndAvatar(userId: string, providerName: string) {
        const provider = await this.findProviderByName(providerName);
        if (!provider) throw new Error("Provider not found");

        // トランザクションで両方消す
        return prisma.$transaction(async (tx) => {
            // 1. 連携情報の削除
            await tx.user_identities.deleteMany({
                where: {
                    user_id: userId,
                    provider_id: provider.id
                }
            });

            // 2. そのサービスから取得したアバター情報の削除
            await tx.user_avatars.deleteMany({
                where: {
                    user_id: userId,
                    service_name: providerName
                }
            });

            // 3. (オプション) もし削除したアバターが現在 users.avatar_url に設定されていたら、null かデフォルトに戻す
            const user = await tx.users.findUnique({ where: { id: userId } });
            if (user?.avatar_url?.includes(`_${providerName}`)) {
                await tx.users.update({
                    where: { id: userId },
                    data: { avatar_url: null } // またはデフォルト画像のパス
                });
            }
        });
    }
}