import { PrismaClient } from "@prisma/client";
import prisma from "../prisma/client.js";
import { parseSearchQuery } from "../utils/searchParser/index.js";
export class StocksRepository {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * ストックリストを新規作成
   */
  async createList(data: {
    userId: string;
    name: string;
    description?: string;
    visibility?: "public" | "limited" | "private";
    is_default?: boolean;
    tagIds?: string[]; // ← 追加
  }) {
    return this.db.stock_lists.create({
      data: {
        user_id: data.userId,
        name: data.name,
        description: data.description,
        visibility: data.visibility ?? "private",
        is_default: data.is_default ?? false,
        // タグがある場合、中間テーブルへレコードを作成
        stock_list_tags:
          data.tagIds && data.tagIds.length > 0
            ? {
                create: data.tagIds.map((tagId) => ({
                  tag_id: tagId,
                })),
              }
            : undefined,
      },
      // レスポンスにタグを含めたい場合は include を追加
      include: {
        stock_list_tags: {
          include: {
            tags: true,
          },
        },
      },
    });
  }

  /**
   * ユーザーが保存したすべての記事を重複なしで取得
   */
  async findAllItemsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
    q?: string,
  ) {
    const skip = (page - 1) * limit;

    // 1. 記事側の検索条件を組み立て
    const articleWhere = this.buildPrismaWhere(q);

    // 2. 検索条件の定義
    // 「ログインユーザーのストックリストに紐づくアイテム」かつ「記事の内容が検索条件に合致する」
    const whereCondition = {
      stock_lists: {
        user_id: userId,
      },
      articles: articleWhere, // ここで記事のタイトルやタグで絞り込む
    };

    // 3. 全件数とデータを同時に取得（whereConditionを両方に適用）
    const [totalCount, items] = await Promise.all([
      this.db.stock_items.count({
        where: whereCondition, // 💡 条件を適用してカウント
      }),
      this.db.stock_items.findMany({
        where: whereCondition, // 💡 条件を適用して取得
        include: {
          articles: {
            include: {
              users: {
                select: {
                  username: true,
                  display_name: true,
                  avatar_url: true,
                },
              },
              article_tags: { include: { tags: true } },
              _count: { select: { article_likes: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // 重複排除ロジック
    // ※ Prismaの `distinct` を使う方法もありますが、現在のMap方式を維持します
    const uniqueArticles = Array.from(
      new Map(items.map((item) => [item.article_id, item.articles])).values(),
    );

    return { articles: uniqueArticles, totalCount };
  }

  /**
   * ユーザーのストックリスト一覧を取得
   * 特定の記事ID(articleId)を渡すと、その記事が各リストに含まれているか(isStored)を判定する
   */
  async findListsByUserId(userId: string, articleId?: string) {
    const lists = await this.db.stock_lists.findMany({
      where: { user_id: userId },
      include: {
        stock_items: articleId
          ? {
              where: { article_id: articleId },
              select: { id: true },
            }
          : false,
        _count: {
          select: { stock_items: true, stock_list_likes: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return lists.map((list) => ({
      ...list,
      isStored: articleId ? (list.stock_items as any[]).length > 0 : false,
      stock_items: undefined, // フロントエンドに不要なネストデータを削減
    }));
  }

  /**
   * リストに記事を追加（重複時はスキップ）
   */
  async addItem(stockListId: string, articleId: string) {
    // 現在のリスト内での最大順序を取得
    const aggregate = await this.db.stock_items.aggregate({
      where: { stock_list_id: stockListId },
      _max: { sort_order: true },
    });

    const nextOrder = (aggregate._max.sort_order ?? 0) + 1;

    return this.db.stock_items.upsert({
      where: {
        stock_list_id_article_id: {
          stock_list_id: stockListId,
          article_id: articleId,
        },
      },
      update: {}, // すでに存在する場合は何もしない
      create: {
        stock_list_id: stockListId,
        article_id: articleId,
        sort_order: nextOrder,
      },
    });
  }

  /**
   * リストから記事を削除
   */
  async removeItem(stockListId: string, articleId: string): Promise<void> {
    await this.db.stock_items.delete({
      where: {
        stock_list_id_article_id: {
          stock_list_id: stockListId,
          article_id: articleId,
        },
      },
    });
  }
  /**
   * 公開されているストックリスト一覧を取得（ページネーション付き）
   */
  async findPublicLists(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [totalCount, lists] = await Promise.all([
      this.db.stock_lists.count({
        where: { visibility: "public" },
      }),
      this.db.stock_lists.findMany({
        where: { visibility: "public" },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          users: {
            select: { username: true, display_name: true, avatar_url: true },
          },
          stock_list_tags: {
            select: {
              tags: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: { stock_items: true, stock_list_likes: true },
          },
        },
      }),
    ]);

    return { totalCount, lists };
  }
  /**
   * リストの詳細を取得（ArticleCardに必要な情報をすべて含む）
   */
  async findListDetail(
    listId: string,
    page: number = 1,
    limit: number = 20,
    q?: string,
  ) {
    const skip = (page - 1) * limit;

    // 1. 検索条件の組み立て (ここがポイント！)
    const articleWhere = this.buildPrismaWhere(q); // parseSearchQuery を使った共通ロジック

    // stock_items 経由で articles を絞り込む条件にする
    const whereCondition = {
      stock_list_id: listId,
      articles: articleWhere, // 記事側の条件をそのまま流し込む
    };

    const [list, totalCount] = await Promise.all([
      this.db.stock_lists.findUnique({
        where: { id: listId },
        include: {
          stock_items: {
            where: whereCondition, // 絞り込みを適用
            include: {
              articles: {
                include: {
                  users: {
                    select: {
                      username: true,
                      display_name: true,
                      avatar_url: true,
                    },
                  },
                  article_tags: { include: { tags: true } },
                  _count: { select: { article_likes: true } },
                },
              },
            },
            orderBy: { created_at: "desc" },
            skip,
            take: limit,
          },
          users: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              bio: true,
            },
          },
          stock_list_tags: {
            select: {
              tags: { select: { id: true, name: true, slug: true } },
            },
          },
          stock_list_likes: true,
          _count: {
            select: { stock_list_likes: true },
          },
        },
      }),
      this.db.stock_items.count({ where: whereCondition }), // 絞り込みを適用してカウント
    ]);

    return list ? { ...list, totalCount } : null;
  }

  /**
   * リスト情報の更新（名前、説明、公開範囲、デフォルト設定）
   */
  async updateList(
    listId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      visibility?: "public" | "limited" | "private";
      is_default?: boolean;
      tagIds?: string[];
    },
  ) {
    const { tagIds, is_default, ...otherData } = data;

    // トランザクションを使用して整合性を保つ
    return this.db.$transaction(async (tx) => {
      // 1. 今回の更新で is_default: true が指定されている場合、他のリストを false に更新
      if (is_default === true) {
        await tx.stock_lists.updateMany({
          where: {
            user_id: userId,
            is_default: true,
            id: { not: listId }, // 自分以外
          },
          data: { is_default: false },
        });
      }

      // 2. 対象リストの更新
      return tx.stock_lists.update({
        where: { id: listId, user_id: userId },
        data: {
          ...otherData,
          is_default: is_default ?? undefined, // null合体演算子でundefinedなら更新対象外に
          // タグの更新
          ...(tagIds !== undefined && {
            stock_list_tags: {
              deleteMany: {},
              create: tagIds.map((tagId) => ({
                tag_id: tagId,
              })),
            },
          }),
        },
      });
    });
  }

  /**
   * リストの削除
   */
  async deleteList(listId: string, userId: string): Promise<void> {
    await this.db.stock_lists.delete({
      where: { id: listId, user_id: userId },
    });
  }

  async isLiked(listId: string, userId: string) {
    return this.db.stock_list_likes.findUnique({
      where: {
        user_id_stock_list_id: { stock_list_id: listId, user_id: userId },
      },
    });
  }
  async addLike(listId: string, userId: string) {
    return this.db.stock_list_likes.create({
      data: { stock_list_id: listId, user_id: userId },
    });
  }
  async removeLike(listId: string, userId: string) {
    return this.db.stock_list_likes.delete({
      where: {
        user_id_stock_list_id: { stock_list_id: listId, user_id: userId },
      },
    });
  }

  private buildPrismaWhere(q?: string) {
    const where: any = {
      is_published: true,
      is_deleted: false,
      is_private: false,
      visibility: "public",
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
