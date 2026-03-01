import { PrismaClient } from "@prisma/client";
import prisma from "../prisma/client.js";
import { parseSearchQuery } from "../utils/searchParser/index.js";

export class ArticlesRepository {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  async findAllPublishedArticles(page: number, limit: number, q?: string) {
    const skip = (page - 1) * limit;
    const where = this.buildPrismaWhere(q);

    const [totalCount, articles] = await Promise.all([
      this.db.articles.count({ where }),
      this.db.articles.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          user_id: true,
          title: true,
          summary: true,
          created_at: true,
          updated_at: true,
          like_count: true,
          stock_count: true,
          is_published: true,
          is_private: true,
          is_deleted: true,
          users: {
            select: { username: true, display_name: true, avatar_url: true },
          },
          article_tags: {
            select: {
              tags: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return {
      articles,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    };
  }

  async findAllArticlesByUserId(userId: string) {
    return this.db.articles.findMany({
      where: { user_id: userId, is_deleted: false },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        user_id: true,
        title: true,
        raw_content: true,
        render_content: true,
        summary: true,
        created_at: true,
        updated_at: true,
        like_count: true,
        stock_count: true,
        is_published: true,
        is_private: true,
        is_deleted: true,
        status: true,
        users: { select: { username: true } },
        article_tags: {
          select: {
            tags: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async findDeletedArticlesByUserId(userId: string) {
    return this.db.articles.findMany({
      where: { user_id: userId, is_deleted: true },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        user_id: true,
        title: true,
        raw_content: true,
        render_content: true,
        summary: true,
        created_at: true,
        updated_at: true,
        like_count: true,
        stock_count: true,
        is_published: true,
        is_private: true,
        is_deleted: true,
        status: true,
        users: { select: { username: true } },
        article_tags: {
          select: {
            tags: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }
  async findArticleById(articleId: string) {
    return this.db.articles.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        raw_content: true,
        render_content: true,
        last_published_raw_content: true,
        like_count: true,
        stock_count: true,
        created_at: true,
        updated_at: true,
        user_id: true,
        summary: true,
        is_published: true,
        is_private: true,
        is_deleted: true,
        users: {
          select: { username: true, display_name: true, avatar_url: true },
        },
        article_tags: {
          select: {
            tags: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async isOwned(articleId: string, userId: string) {
    const count = await this.db.articles.count({
      where: { id: articleId, user_id: userId },
    });
    return count > 0;
  }

  async isLiked(articleId: string, userId: string) {
    return this.db.article_likes.findUnique({
      where: { article_id_user_id: { article_id: articleId, user_id: userId } },
    });
  }

  async getArticleLikeUserByArticleId(articleId: string) {
    return this.db.article_likes.findMany({
      where: { article_id: articleId },
      include: { users: true },
    });
  }

  async addLike(articleId: string, userId: string) {
    return this.db.article_likes.create({
      data: { article_id: articleId, user_id: userId },
    });
  }

  async removeLike(articleId: string, userId: string) {
    return this.db.article_likes.delete({
      where: { article_id_user_id: { article_id: articleId, user_id: userId } },
    });
  }

  async createArticles(data: any, tagIds: string[] = []) {
    return this.db.articles.create({
      data: {
        ...data,
        // 中間テーブル article_tags を同時に作成
        article_tags: {
          create: tagIds.map((id) => ({
            tag_id: id,
          })),
        },
      },
      include: {
        article_tags: true,
      },
    });
  }

  async updateArticles(articleId: string, data: any, tagIds?: string[]) {
    return this.db.articles.update({
      where: { id: articleId },
      data: {
        ...data,
        // タグが指定されている場合、一度既存の紐付けを削除して再作成（リセット）
        ...(tagIds && {
          article_tags: {
            deleteMany: {}, // 既存の紐付けを全削除
            create: tagIds.map((id) => ({
              tag_id: id,
            })),
          },
        }),
      },
      include: {
        article_tags: true,
      },
    });
  }
  async softDeleteArticle(articleId: string) {
    return this.db.articles.update({
      where: { id: articleId },
      data: { is_deleted: true },
    });
  }

  // 🚀 復元 (is_deleted を false に)
  async restoreArticle(articleId: string) {
    return this.db.articles.update({
      where: { id: articleId },
      data: { is_deleted: false },
    });
  }

  // 🚀 物理削除 (DBから完全に消去)
  async hardDeleteArticle(articleId: string) {
    return this.db.articles.delete({
      where: { id: articleId },
    });
  }
  async incrementViewCount(articleId: string) {
    return this.db.articles.update({
      where: { id: articleId },
      data: { view_count: { increment: 1 } },
    });
  }

  private buildPrismaWhere(q?: string) {
    const where: any = {
      is_published: true,
      is_deleted: false,
      is_private: false,
      AND: [],
    };

    if (!q) return where;

    const parsed = parseSearchQuery(q);

    // title:
    if (parsed.title) {
      parsed.title.forEach((t) =>
        where.AND.push({ title: { contains: t, mode: "insensitive" } }),
      );
    }

    // body:
    if (parsed.body) {
      parsed.body.forEach((b) =>
        where.AND.push({ raw_content: { contains: b, mode: "insensitive" } }),
      );
    }

    // tag: / -tag:
    if (parsed.tags && parsed.tags.length > 0) {
      parsed.tags.forEach((tag) => {
        const tagCondition = {
          article_tags: { some: { tags: { name: tag.name } } },
        };
        if (tag.exclude) where.AND.push({ NOT: tagCondition });
        else where.AND.push(tagCondition);
      });
    }

    // stocks:
    if (parsed.stocks) {
      where.AND.push({
        like_count: { [parsed.stocks.operator]: parsed.stocks.value },
      });
    }

    // user:
    if (parsed.user) {
      where.AND.push({ users: { username: parsed.user } });
    }

    // created:
    if (parsed.created) {
      where.AND.push({
        created_at: { [parsed.created.operator]: parsed.created.value },
      });
    }

    // updated:
    if (parsed.updated) {
      where.AND.push({
        updated_at: { [parsed.updated.operator]: parsed.updated.value },
      });
    }

    // freeWords (title or body)
    if (parsed.freeWords.length > 0) {
      parsed.freeWords.forEach((word) => {
        where.AND.push({
          OR: [
            { title: { contains: word, mode: "insensitive" } },
            { raw_content: { contains: word, mode: "insensitive" } },
          ],
        });
      });
    }

    if (where.AND.length === 0) delete where.AND;
    return where;
  }
}
