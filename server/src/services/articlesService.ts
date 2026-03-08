import { ArticlesRepository } from "../repositories/articlesRepository.js";

export class ArticlesService {
  constructor(private articlesRepo: ArticlesRepository) {}

  async getPublishedArticleList(page: number, limit: number, q?: string) {
    return await this.articlesRepo.findAllPublishedArticles(page, limit, q);
  }
  // articlesService.ts 内に追加
  async getTrendingArticleList(page: number, limit: number, weights?: any) {
    // デフォルトの重み付け設定
    const safeWeights = {
      like: Number(weights?.like ?? 10),
      view: Number(weights?.view ?? 1),
      stock: Number(weights?.stock ?? 20),
      comment: Number(weights?.comment ?? 15),
    };

    return await this.articlesRepo.findTrendingArticles(
      safeWeights,
      page,
      limit,
    );
  }
  async getArticle(articleId: string, currentUserId?: string) {
    const article = await this.articlesRepo.findArticleById(articleId);
    if (!article || article.is_deleted) throw new Error("ArticleNotFound");

    // 1. 本人チェック（所有者なら問答無用で全データを返す）
    if (currentUserId && article.user_id === currentUserId) {
      return article;
    }

    // 2. 本人以外（ゲスト含む）への制限
    // 非公開設定(is_private)なら拒否
    if (article.is_private) {
      throw new Error("Forbidden");
    }

    // 限定公開(is_published: false)であっても、ここ（URL直接叩き）に来ているなら
    // is_privateさえfalseなら閲覧を許可する
    return article;
  }

  async getAllArticlesByUserId(userId: string) {
    return await this.articlesRepo.findAllArticlesByUserId(userId);
  }

  async getArticleLikeUserWithCount(articleId: string) {
    const likeRecords =
      await this.articlesRepo.getArticleLikeUserByArticleId(articleId);
    const likeUsers = likeRecords.map((record: any) => record.users);
    return {
      like_users: likeUsers,
      like_count: likeUsers.length,
    };
  }

  async getIsOwned(articleId: string, userId: string) {
    return await this.articlesRepo.isOwned(articleId, userId);
  }

  async getIsLiked(articleId: string, userId: string) {
    const isLike = await this.articlesRepo.isLiked(articleId, userId);
    return !!isLike;
  }

  async toggleLike(articleId: string, userId: string) {
    const existing = await this.articlesRepo.isLiked(articleId, userId);
    if (existing) {
      await this.articlesRepo.removeLike(articleId, userId);
      return { isLike: false, message: "いいねを解除しました" };
    } else {
      await this.articlesRepo.addLike(articleId, userId);
      return { isLike: true, message: "いいねしました" };
    }
  }

  async createArticle(userId: string, payload: any) {
    const { tagIds, raw_content, status, is_published, is_private, summary } =
      payload;

    // 🚀 新規作成時は、status: 'public' なら「即時公開」、'draft' なら「下書き」として扱う
    const isPublicMode = status === "public";

    return this.articlesRepo.createArticles(
      {
        user_id: userId,
        title: payload.title,
        raw_content: raw_content,
        // 公開モードなら現在の内容を反映、下書きなら空文字 or 初期値
        render_content: isPublicMode ? raw_content : "",
        last_published_raw_content: isPublicMode ? raw_content : undefined,
        summary: summary || raw_content?.substring(0, 100),
        // 🚀 ルール通り：status は下書きがあるかどうか
        status: isPublicMode ? "public" : "draft",
        // 🚀 公開設定フラグをそのまま保存
        is_published: is_published ?? false,
        is_private: is_private ?? false,
      },
      tagIds,
    );
  }

  async updateArticle(articleId: string, userId: string, payload: any) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing) throw new Error("ArticleNotFound");
    if (existing.user_id !== userId) throw new Error("Forbidden");

    const {
      tagIds,
      raw_content,
      status,
      is_published,
      is_private,
      ...otherData
    } = payload;

    const updateData: any = { ...otherData };

    // 🚀 「保存して公開（更新）」ボタンが押された場合
    if (status === "public") {
      updateData.raw_content = raw_content;
      updateData.render_content = raw_content; // 公開内容を同期
      updateData.last_published_raw_content = raw_content; // 差分比較用のバックアップを更新
      updateData.status = "public"; // 下書きなし状態へ
      updateData.is_published = is_published; // 最新の公開設定を反映
      updateData.is_private = is_private; // 最新の非公開設定を反映
    }
    // 🚀 「下書き保存」ボタンが押された場合
    else if (status === "draft") {
      updateData.raw_content = raw_content;
      updateData.status = "draft"; // 下書きあり状態へ

      // 💡 重要：下書き保存時は、現在の「公開されている状態」を変えない
      updateData.is_published = existing.is_published;
      updateData.is_private = existing.is_private;
      // render_content と last_published_raw_content は既存を維持（差分を作るため）
    }

    return this.articlesRepo.updateArticles(articleId, updateData, tagIds);
  }

  async rollbackDraft(articleId: string, userId: string) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || existing.user_id !== userId)
      throw new Error("Unauthorized or Not Found");
    if (!existing.last_published_raw_content)
      throw new Error("No published version to rollback to");

    const rollbackData = {
      raw_content: existing.last_published_raw_content, // 公開時の内容で上書き
      status: "public", // ステータスを公開に戻す
      // render_content は既に last_published_raw_content と一致しているはず
    };

    return this.articlesRepo.updateArticles(articleId, rollbackData);
  }
  async deleteArticle(articleId: string, userId: string) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || existing.user_id !== userId) {
      throw new Error("Unauthorized or Not Found");
    }
    return await this.articlesRepo.softDeleteArticle(articleId);
  }

  async getTrashArticles(userId: string) {
    return await this.articlesRepo.findDeletedArticlesByUserId(userId);
  }

  // 復元
  async restoreArticle(articleId: string, userId: string) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || existing.user_id !== userId)
      throw new Error("Unauthorized");
    return await this.articlesRepo.restoreArticle(articleId);
  }

  // 物理削除
  async hardDeleteArticle(articleId: string, userId: string) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || existing.user_id !== userId)
      throw new Error("Unauthorized");
    return await this.articlesRepo.hardDeleteArticle(articleId);
  }
}
