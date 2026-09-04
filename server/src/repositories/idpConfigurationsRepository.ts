import { PrismaClient } from "@prisma/client";
import prisma from "../prisma/client.js";

export class IdpConfigurationRepository {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }
  async getProviders() {
    return this.db.identity_providers.findMany({
      where: {
        idp_configurations: { is_active: true },
      },
      include: {
        idp_configurations: true,
      },
      orderBy: { created_at: "asc" },
    });
  }

  async getAllProviders() {
    return this.db.identity_providers.findMany({
      include: {
        idp_configurations: true,
        _count: {
          select: { user_identities: true },
        },
      },
      orderBy: { created_at: "asc" },
    });
  }

  async getConfiguration(provider_name: string) {
    return this.db.identity_providers.findUnique({
      where: { provider_name },
      include: { idp_configurations: true },
    });
  }

  async upsertIdp(provider_name: string, data: any) {
    return this.db.$transaction(async (tx) => {
      // identity_providers を UPSERT（存在なければ作成）
      const identityProvider = await tx.identity_providers.upsert({
        where: { provider_name },
        update: {
          display_name: data.display_name,
          provider_type: data.provider_type,
          description: data.description,
          logo_url: data.logo_url,
          updated_at: new Date(),
        },
        create: {
          provider_name,
          display_name: data.display_name ?? provider_name,
          provider_type: data.provider_type ?? "OAUTH2",
          description: data.description,
          logo_url: data.logo_url,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // idp_configurations を UPSERT
      const config = await tx.idp_configurations.upsert({
        where: { provider_id: identityProvider.id },
        update: {
          config: data.config,
          button_color: data.button_color,
          text_color: data.text_color,
          is_active: data.is_active,
          updated_at: new Date(),
        },
        create: {
          provider_id: identityProvider.id,
          config: data.config,
          button_color: data.button_color,
          text_color: data.text_color,
          is_active: data.is_active,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { identityProvider, config };
    });
  }
  async toggleIdpActive(provider_name: string) {
    return this.db.$transaction(async (tx) => {
      // まず対象の IDP を取得
      const identityProvider = await tx.identity_providers.findUnique({
        where: { provider_name },
      });

      if (!identityProvider) {
        throw new Error(
          `Identity provider "${provider_name}" が見つかりません`,
        );
      }

      // idp_configurations の is_active を反転
      const config = await tx.idp_configurations.update({
        where: { provider_id: identityProvider.id },
        data: {
          is_active: {
            set: !(
              await tx.idp_configurations.findUnique({
                where: { provider_id: identityProvider.id },
                select: { is_active: true },
              })
            )?.is_active,
          },
          updated_at: new Date(),
        },
      });

      return { identityProvider, config };
    });
  }
  async deleteIdp(provider_name: string) {
    return this.db.$transaction(async (tx) => {
      // 1. 対象の IDP を取得して ID を特定
      const identityProvider = await tx.identity_providers.findUnique({
        where: { provider_name },
      });

      if (!identityProvider) {
        throw new Error(
          `Identity provider "${provider_name}" が見つかりません`,
        );
      }

      // 2. 依存している設定 (idp_configurations) を削除
      await tx.idp_configurations.deleteMany({
        where: { provider_id: identityProvider.id },
      });

      // 3. 親の identity_providers を削除
      await tx.identity_providers.delete({
        where: { id: identityProvider.id },
      });

      return { success: true, deletedProvider: provider_name };
    });
  }

  async cleanupOrphanProvider(provider_name: string) {
    return this.db.$transaction(async (tx) => {
      const provider = await tx.identity_providers.findUnique({
        where: { provider_name },
        include: {
          idp_configurations: true,
          _count: {
            select: { user_identities: true },
          },
        },
      });

      if (!provider) {
        throw new Error(`Identity provider "${provider_name}" が見つかりません`);
      }
      if (provider.idp_configurations) {
        throw new Error("DB設定が存在するIdPはクリーンアップできません");
      }
      if (provider._count.user_identities > 0) {
        throw new Error(
          `このIdPには${provider._count.user_identities}件のユーザーIdentityが紐付いているため削除できません`,
        );
      }

      await tx.identity_providers.delete({ where: { id: provider.id } });
      return { success: true, deletedProvider: provider_name };
    });
  }
}
