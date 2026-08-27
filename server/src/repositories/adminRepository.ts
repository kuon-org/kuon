import prisma from "../prisma/client.js";

export class AdminRepository {
  async findAllUsers() {
    const users = await prisma.users.findMany({
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    return users.map(({ user_roles, ...user }) => ({
      ...user,
      // Keep role for compatibility with the existing client while exposing
      // complete role information for multi-role assignment.
      role: user_roles.map((ur) => ur.roles?.name).filter(Boolean),
      roles: user_roles
        .filter((ur) => ur.roles)
        .map((ur) => ({
          id: ur.roles!.id,
          name: ur.roles!.name,
          display_name: ur.roles!.display_name,
        })),
    }));
  }

  async toggleUserActiveStatus(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { is_active: true },
    });

    if (!user) throw new Error("UserNotFound");

    return await prisma.users.update({
      where: { id: userId },
      data: {
        is_active: !user.is_active,
        updated_at: new Date(),
      },
    });
  }
}
