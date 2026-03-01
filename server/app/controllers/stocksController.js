import { isAuthenticated } from "../middlewares/auth.js";
export class StocksController {
    constructor(stockService) {
        this.stockService = stockService;
        /**
         * 【新】公開ストックリスト一覧を取得 (GET /stocks/lists)
         */
        this.getPublicStockLists = async (req, res) => {
            try {
                const page = Math.max(1, parseInt(req.query.page) || 1);
                const limit = Math.min(50, parseInt(req.query.limit) || 12);
                const result = await this.stockService.getPublicStockLists(page, limit);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        /**
         * ユーザーのストックリスト一覧を取得
         * クエリパラメータ articleId がある場合は、その記事が含まれているかのフラグを付与
         */
        this.getMyStockLists = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            try {
                const articleId = req.query.articleId;
                const lists = await this.stockService.getUserStockLists(req.user.userId, articleId);
                res.json(lists);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        /**
         * ストックリストの新規作成
         */
        this.createStockList = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            try {
                const newList = await this.stockService.createStockList(req.user.userId, req.body);
                res.status(201).json(newList);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        /**
         * リストへの記事追加/削除のトグル
         */
        this.toggleArticleInList = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            try {
                const listId = String(req.params.listId);
                const { articleId } = req.body;
                const result = await this.stockService.toggleArticleInStock(req.user.userId, listId, articleId);
                res.json(result);
            }
            catch (error) {
                let status = 500;
                if (error.message === "StockListNotFound or Unauthorized")
                    status = 403;
                res.status(status).json({ message: error.message });
            }
        };
        this.toggleDefaultStock = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            try {
                const { articleId } = req.body;
                const result = await this.stockService.toggleDefaultStock(req.user.userId, articleId);
                res.json(result);
            }
            catch (error) {
                if (error.message === "DefaultListNotFound") {
                    return res
                        .status(404)
                        .json({ message: "デフォルトリストが設定されていません" });
                }
                res.status(500).json({ message: error.message });
            }
        };
        this.getIsLiked = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const isLiked = await this.stockService.getIsLiked(String(req.params.listId), req.user.userId);
                res.json({ isLiked });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.toggleLike = async (req, res) => {
            try {
                if (!isAuthenticated(req))
                    return res.status(401).json({ message: "未ログインです" });
                const result = await this.stockService.toggleLike(String(req.params.listId), req.user.userId);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getMyAllStockListDetail = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            try {
                const page = Math.max(1, parseInt(req.query.page) || 1);
                const limit = Math.min(50, parseInt(req.query.limit) || 20);
                const q = req.query.q;
                const lists = await this.stockService.getMyAllStockListDetail(req.user.userId, page, limit, q);
                res.json(lists);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        /**
         * リスト詳細（記事一覧）の取得
         */
        this.getStockListDetail = async (req, res) => {
            try {
                const listId = String(req.params.listId);
                const userId = req.user?.userId;
                const page = Math.max(1, parseInt(req.query.page) || 1);
                const limit = Math.min(50, parseInt(req.query.limit) || 20);
                const q = req.query.q; // 検索クエリ文字列を取得
                const list = await this.stockService.getStockListDetail(listId, userId, page, limit, q);
                res.json(list);
            }
            catch (error) {
                let status = 500;
                if (error.message === "StockListNotFound")
                    status = 404;
                if (error.message === "Forbidden")
                    status = 403;
                res.status(status).json({ message: error.message });
            }
        };
        /**
         * リストの更新
         */
        this.updateStockList = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            try {
                const listId = String(req.params.listId);
                const updated = await this.stockService.updateStockList(listId, req.user.userId, req.body);
                res.json(updated);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        /**
         * リストの削除
         */
        this.deleteStockList = async (req, res) => {
            if (!isAuthenticated(req))
                return res.status(401).json({ message: "未ログインです" });
            try {
                const listId = String(req.params.listId);
                await this.stockService.deleteStockList(listId, req.user.userId);
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
    }
}
