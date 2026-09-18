import prisma from "../prisma/client.js";

export type GroupRole = "owner" | "admin" | "member";

export class GroupsRepository {
  findAll() {
    return prisma.groups.findMany({
      orderBy: { display_name: "asc" },
      include: { _count: { select: { user_groups: true, articles: true } } },
    });
  }

  findBySlug(slug: string) {
    return prisma.groups.findUnique({
      where: { slug },
      include: {
        user_groups: {
          orderBy: [{ role: "asc" }, { joined_at: "asc" }],
          include: {
            users: { select: { id: true, username: true, display_name: true, avatar_url: true } },
          },
        },
        _count: { select: { articles: true } },
      },
    });
  }

  findById(id: string) {
    return prisma.groups.findUnique({ where: { id } });
  }

  findMembership(userId: string, groupId: string) {
    return prisma.user_groups.findUnique({
      where: { user_id_group_id: { user_id: userId, group_id: groupId } },
    });
  }

  findUserByUsername(username: string) {
    return prisma.users.findUnique({ where: { username }, select: { id: true } });
  }

  findMine(userId: string) {
    return prisma.user_groups.findMany({
      where: { user_id: userId },
      orderBy: { joined_at: "asc" },
      include: {
        groups: { include: { _count: { select: { user_groups: true, articles: true } } } },
      },
    });
  }

  create(userId: string, data: { name: string; slug: string; display_name: string; description?: string | null }) {
    return prisma.groups.create({
      data: {
        ...data,
        created_by: userId,
        user_groups: { create: { user_id: userId, role: "owner" } },
      },
      include: { user_groups: true },
    });
  }

  update(id: string, data: { name?: string; display_name?: string; description?: string | null }) {
    return prisma.groups.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }

  delete(id: string) {
    return prisma.groups.delete({ where: { id } });
  }

  async addMember(groupId: string, username: string, role: GroupRole) {
    const user = await this.findUserByUsername(username);
    if (!user) throw new Error("UserNotFound");
    return prisma.user_groups.upsert({
      where: { user_id_group_id: { user_id: user.id, group_id: groupId } },
      create: { user_id: user.id, group_id: groupId, role },
      update: { role },
    });
  }

  updateMemberRole(groupId: string, userId: string, role: GroupRole) {
    return prisma.user_groups.update({
      where: { user_id_group_id: { user_id: userId, group_id: groupId } },
      data: { role },
    });
  }

  removeMember(groupId: string, userId: string) {
    return prisma.user_groups.delete({
      where: { user_id_group_id: { user_id: userId, group_id: groupId } },
    });
  }

  async findArticles(groupId: string, page: number, limit: number) {
    const where = { group_id: groupId, is_published: true, is_deleted: false, is_private: false };
    const [totalCount, articles] = await Promise.all([
      prisma.articles.count({ where }),
      prisma.articles.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, user_id: true, group_id: true, title: true, summary: true,
          created_at: true, updated_at: true, like_count: true, stock_count: true,
          users: { select: { username: true, display_name: true, avatar_url: true } },
          groups: { select: { id: true, slug: true, display_name: true } },
          article_tags: { select: { tags: { select: { id: true, name: true, slug: true, avatar_url: true } } } },
        },
      }),
    ]);
    return { articles, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page, limit };
  }
}
