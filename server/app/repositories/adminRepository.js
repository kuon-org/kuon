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
        // user_rolesを除外してroleだけ残す
        return users.map(({ user_roles, ...user }) => ({
            ...user,
            role: user_roles.map((ur) => ur.roles?.name).filter(Boolean),
        }));
    }
    /**
     * 現在の状態を反転させる (Toggle)
     */
    async toggleUserActiveStatus(userId) {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { is_active: true },
        });
        if (!user)
            throw new Error("UserNotFound");
        return await prisma.users.update({
            where: { id: userId },
            data: {
                is_active: !user.is_active,
                updated_at: new Date(),
            },
        });
    }
}
