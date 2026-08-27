import prisma from "../prisma/client.js";

export class NotificationRepository {
  async findByUserId(userId: string, limit = 20) {
    return prisma.user_notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
    });
  }

  async countUnread(userId: string) {
    return prisma.user_notifications.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async create(data: {
    user_id: string;
    type: string;
    title: string;
    message?: string | null;
    reference_id?: string | null;
  }) {
    return prisma.user_notifications.create({ data });
  }

  async markRead(userId: string, notificationId: string) {
    return prisma.user_notifications.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllRead(userId: string) {
    return prisma.user_notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
