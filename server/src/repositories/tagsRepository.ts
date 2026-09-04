import { PrismaClient } from "@prisma/client";
import prisma from "../prisma/client.js";

export class TagsRepository {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  async findAllTags() {
    return this.db.tags.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        avatar_url: true,
        article_tags: {
          select: {
            article_id: true,
          },
        },
        _count: {
          select: {
            tag_follows: true,
          },
        },
      },
    });
  }

  async findTagBySlug(slug: string) {
    return this.db.tags.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            article_tags: true,
            tag_follows: true,
          },
        },
      },
    });
  }

  async createTag(data: {
    name: string;
    slug: string;
    description?: string;
    avatar_url?: string;
  }) {
    return this.db.tags.create({ data });
  }

  async updateTagBySlug(data: {
    name: string;
    slug: string;
    description?: string;
    avatar_url?: string;
  }) {
    return this.db.tags.update({
      where: { slug: data.slug },
      data: {
        name: data.name,
        description: data.description,
        avatar_url: data.avatar_url,
      },
    });
  }

  async followingTags(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [totalCount, tags] = await Promise.all([
      this.db.tag_follows.count({ where: { user_id: userId } }),
      this.db.tag_follows.findMany({
        where: {
          user_id: userId,
        },
        skip,
        take: limit,
        include: {
          tags: true,
        },
      }),
    ]);

    return {
      tags,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    };
  }

  private async getTagIdBySlug(slug: string) {
    const tag = await this.db.tags.findUnique({
      where: { slug },
      select: { id: true },
    });
    return tag?.id;
  }

  async isFollowing(userId: string, slug: string) {
    const tagId = await this.getTagIdBySlug(slug);
    if (!tagId) return false;
    return this.db.tag_follows.findUnique({
      where: { user_id_tag_id: { tag_id: tagId, user_id: userId } },
    });
  }

  async addFollowing(userId: string, slug: string) {
    const tagId = await this.getTagIdBySlug(slug);
    if (!tagId) throw new Error("タグが存在しません");
    return this.db.tag_follows.create({
      data: { tag_id: tagId, user_id: userId },
    });
  }

  async removeFollowing(userId: string, slug: string) {
    const tagId = await this.getTagIdBySlug(slug);
    if (!tagId) throw new Error("タグが存在しません");
    return this.db.tag_follows.delete({
      where: { user_id_tag_id: { tag_id: tagId, user_id: userId } },
    });
  }
}
