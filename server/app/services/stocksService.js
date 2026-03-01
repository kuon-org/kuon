export class StocksService {
    constructor(stockRepo) {
        this.stockRepo = stockRepo;
    }
    /**
     * 公開されているストックリスト一覧を取得
     */
    async getPublicStockLists(page, limit) {
        const { totalCount, lists } = await this.stockRepo.findPublicLists(page, limit);
        return {
            lists,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
            },
        };
    }
    /**
     * ユーザーのストックリスト一覧を取得する
     * 特定の記事が保存済みかどうかのフラグ(isStored)付き
     */
    async getUserStockLists(userId, articleId) {
        return await this.stockRepo.findListsByUserId(userId, articleId);
    }
    /**
     * ストックリストを新規作成する
     */
    async createStockList(userId, payload) {
        return await this.stockRepo.createList({
            userId,
            ...payload,
        });
    }
    /**
     * 指定したリストに記事を追加する（トグル形式ではなく明示的な追加）
     */
    async addArticleToStock(stockListId, articleId) {
        return await this.stockRepo.addItem(stockListId, articleId);
    }
    /**
     * 指定したリストから記事を削除する
     */
    async removeArticleFromStock(stockListId, articleId) {
        return await this.stockRepo.removeItem(stockListId, articleId);
    }
    /**
     * 【便利機能】特定のリストに対して保存状態を反転させる (YouTubeのチェックボックス操作用)
     */
    async toggleArticleInStock(userId, stockListId, articleId) {
        // 1. まずそのリストが自分のものかチェック（セキュリティ）
        const lists = await this.stockRepo.findListsByUserId(userId, articleId);
        const targetList = lists.find((l) => l.id === stockListId);
        if (!targetList) {
            throw new Error("StockListNotFound or Unauthorized");
        }
        if (targetList.isStored) {
            // すでに保存されているなら削除
            await this.stockRepo.removeItem(stockListId, articleId);
            return { isStored: false, message: "リストから削除しました" };
        }
        else {
            // 保存されていないなら追加
            await this.stockRepo.addItem(stockListId, articleId);
            return { isStored: true, message: "リストに追加しました" };
        }
    }
    async toggleDefaultStock(userId, articleId) {
        // 1. ユーザーのリスト一覧を取得
        const lists = await this.stockRepo.findListsByUserId(userId, articleId);
        // 2. is_default フラグが true のリストを探す
        const defaultList = lists.find((l) => l.is_default);
        if (!defaultList) {
            throw new Error("DefaultListNotFound");
        }
        // 3. 既存のトグルロジックを実行
        if (defaultList.isStored) {
            await this.stockRepo.removeItem(defaultList.id, articleId);
            return { isStored: false, message: "デフォルトリストから解除しました" };
        }
        else {
            await this.stockRepo.addItem(defaultList.id, articleId);
            return { isStored: true, message: "デフォルトリストに保存しました" };
        }
    }
    async getIsLiked(listId, userId) {
        const isLike = await this.stockRepo.isLiked(listId, userId);
        return !!isLike;
    }
    async toggleLike(listId, userId) {
        const exiting = await this.stockRepo.isLiked(listId, userId);
        if (exiting) {
            await this.stockRepo.removeLike(listId, userId);
            return { isLike: false, message: "いいねを解除しました" };
        }
        else {
            await this.stockRepo.addLike(listId, userId);
            return { isLike: true, message: "いいねしました" };
        }
    }
    /**
     * 自分の全ストック記事をマージして取得 (認証必須)
     */
    async getMyAllStockListDetail(userId, page = 1, limit = 20, q) {
        const { articles, totalCount } = await this.stockRepo.findAllItemsByUserId(userId, page, limit, q);
        return {
            id: "all",
            name: "すべてのストックリスト",
            description: "保存したすべての記事を新しい順に表示しています",
            stock_items: articles.map((article) => ({
                articles: { ...article, like_count: article._count.article_likes },
            })),
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
            },
        };
    }
    /**
     * リストの詳細（中身の記事一覧）を取得
     * 公開範囲のバリデーションをここで行う
     */
    async getStockListDetail(listId, currentUserId, page = 1, limit = 20, q) {
        const list = await this.stockRepo.findListDetail(listId, page, limit, q);
        if (!list)
            throw new Error("StockListNotFound");
        if (list.visibility === "private" && list.user_id !== currentUserId) {
            throw new Error("Forbidden");
        }
        return {
            ...list,
            stock_items: list.stock_items.map((item) => ({
                ...item,
                articles: {
                    ...item.articles,
                    like_count: item.articles._count.article_likes,
                },
            })),
            pagination: {
                totalCount: list.totalCount,
                totalPages: Math.ceil(list.totalCount / limit),
                currentPage: page,
            },
        };
    }
    /**
     * リスト情報の更新
     */
    async updateStockList(listId, userId, payload) {
        return await this.stockRepo.updateList(listId, userId, payload);
    }
    /**
     * リストの削除
     */
    async deleteStockList(listId, userId) {
        return await this.stockRepo.deleteList(listId, userId);
    }
}
