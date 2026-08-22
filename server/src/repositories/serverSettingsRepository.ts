import prisma from "../prisma/client.js";

export class ServerSettingsRepository {
  async findAll() {
    return prisma.server_settings.findMany({
      orderBy: { key: "asc" },
    });
  }

  async findByKey(key: string) {
    return prisma.server_settings.findUnique({
      where: { key },
    });
  }

  async upsert(key: string, value: string) {
    return prisma.server_settings.upsert({
      where: { key },
      create: { key, value },
      update: {
        value,
        updated_at: new Date(),
      },
    });
  }

  async delete(key: string): Promise<void> {
    await prisma.server_settings.delete({
      where: { key },
    });
  }
}
