import { PrismaClient } from '@prisma/client';
import prisma from '../prisma/client.js';

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
            article_id: true
          }
        },
        _count: {
          select: {
            tag_follows: true
          }
        }
      }
    });
  }

  async findTagBySlug(slug: string) {
    return this.db.tags.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            article_tags: true,
            tag_follows: true
          }
        }
      }
    })
  }

  // slugをキーにして保存または更新を行う
  async upsertTag(data: { name: string; slug: string; description?: string }) {
    return this.db.tags.upsert({
      where: {
        slug: data.slug, // スキーマで@uniqueを設定したため可能
      },
      update: {
        name: data.name,
        description: data.description,
      },
      create: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });
  }
}