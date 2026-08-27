import type { Response } from "express";

class NotificationStreamService {
  private readonly clients = new Map<string, Set<Response>>();

  add(userId: string, res: Response) {
    const userClients = this.clients.get(userId) ?? new Set<Response>();
    userClients.add(res);
    this.clients.set(userId, userClients);
  }

  remove(userId: string, res: Response) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;
    userClients.delete(res);
    if (userClients.size === 0) this.clients.delete(userId);
  }

  notify(userId: string) {
    const payload = "event: notifications-changed\ndata: {}\n\n";
    for (const client of this.clients.get(userId) ?? []) {
      client.write(payload);
    }
  }
}

export const notificationStreamService = new NotificationStreamService();
