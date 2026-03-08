import prisma from "../prisma/client.js";
import { users, local_accounts, user_security } from "@prisma/client";
import argon2 from "argon2";
import { UUID } from "../utils/uuid/index.js";

export class UsersRepository {
  // --- users ---
  async findAllUsers(): Promise<users[]> {
    return prisma.users.findMany();
  }

  async findUserById(userId: string): Promise<users | null> {
    return prisma.users.findUnique({ where: { id: userId } });
  }

  async findUserByUsername(username: string): Promise<users | null> {
    return prisma.users.findFirst({ where: { username } });
  }

  async createUser(
    id: UUID,
    username: string,
    email: string,
    displayName?: string,
  ): Promise<users> {
    return prisma.users.create({
      data: {
        id,
        username,
        email,
        display_name: displayName ?? username,
      },
    });
  }

  async isUsernameExisting(username: string) {
    return prisma.users.findUnique({ where: { username } });
  }

  async updateUser(userId: string, data: any) {
    return prisma.users.update({
      where: { id: userId },
      data,
    });
  }

  // --- local_accounts ---
  async findLocalAccountByEmail(email: string): Promise<local_accounts | null> {
    return prisma.local_accounts.findFirst({ where: { email } });
  }

  async findLocalAccountByUsername(
    username: string,
  ): Promise<local_accounts | null> {
    return prisma.local_accounts.findFirst({
      where: { users: { username } },
    });
  }

  async findLocalAccountByUserId(
    userId: string,
  ): Promise<local_accounts | null> {
    return prisma.local_accounts.findFirst({ where: { user_id: userId } });
  }

  async createLocalAccount(
    username: string,
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{
    user: users;
    account: local_accounts;
    security: any;
    role: any;
  }> {
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

  async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<local_accounts> {
    const account = await this.findLocalAccountByUserId(userId);
    if (!account) throw new Error("LocalAccountNotFound");

    const passwordHash = await argon2.hash(newPassword);
    return prisma.local_accounts.update({
      where: { id: account.id },
      data: { password_hash: passwordHash },
    });
  }

  // --- security ---
  async findUserSecurity(userId: string): Promise<user_security | null> {
    return prisma.user_security.findUnique({ where: { user_id: userId } });
  }

  async update2FASetting(
    userId: string,
    secret: string,
    isEnabled?: boolean,
  ): Promise<user_security> {
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

  async delete2FASetting(userId: string): Promise<user_security> {
    return prisma.user_security.update({
      where: { user_id: userId },
      data: {
        totp_secret: null,
        is_2fa_enabled: false,
      },
    });
  }

  // --- follows ---
  async followUser(followerId: string, followeeId: string) {
    return prisma.user_follows.create({
      data: { follower_id: followerId, followee_id: followeeId },
    });
  }

  async unFollowUser(followerId: string, followeeId: string) {
    return prisma.user_follows.delete({
      where: {
        follower_id_followee_id: {
          follower_id: followerId,
          followee_id: followeeId,
        },
      },
    });
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
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

  async getFollowers(userId: string) {
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

  async getFollowings(userId: string) {
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
  async getUserRole(userId: string) {
    return prisma.user_roles.findFirst({
      where: { user_id: userId },
      select: {
        roles: { select: { name: true } },
      },
    });
  }

  async getUserIdentities(userId: string) {
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
  async upsertLocalAvatar(userId: string, avatarUrl: string) {
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

      const shouldSelect =
        !currentSelected || !currentSelected.users.avatar_url;

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
      } else {
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

  async isAdmin(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: { roles: true },
        },
      },
    });
    if (!user) return false;
    return user.user_roles.some(
      (ur): ur is { roles: { name: string } } & typeof ur =>
        !!ur.roles && ur.roles.name === "admin",
    );
  }

  async updateLastLogin(userId: string) {
    return await prisma.users.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });
  }

  async followingTags(userId: string) {
    return await prisma.tag_follows.findMany({
      where: { user_id: userId },
      include: {
        tags: true,
      },
    });
  }
}
