import { Request, Response } from "express";
import { StocksService } from "../services/stocksService.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";

export class StocksController {
  constructor(private stockService: StocksService) {}

  /**
   * 【新】公開ストックリスト一覧を取得 (GET /stocks/lists)
   */
  getPublicStockLists = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 12);

      const result = await this.stockService.getPublicStockLists(page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * ユーザーのストックリスト一覧を取得
   * クエリパラメータ articleId がある場合は、その記事が含まれているかのフラグを付与
   */
  getMyStockLists = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    try {
      const articleId = req.query.articleId as string;
      const lists = await this.stockService.getUserStockLists(
        req.user.userId,
        articleId,
      );
      res.json(lists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * ストックリストの新規作成
   */
  createStockList = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    try {
      const newList = await this.stockService.createStockList(
        req.user.userId,
        req.body,
      );
      res.status(201).json(newList);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * リストへの記事追加/削除のトグル
   */
  toggleArticleInList = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    try {
      const listId = String(req.params.listId);
      const { articleId } = req.body;
      const result = await this.stockService.toggleArticleInStock(
        req.user.userId,
        listId,
        articleId,
      );
      res.json(result);
    } catch (error: any) {
      let status = 500;
      if (error.message === "StockListNotFound or Unauthorized") status = 403;
      res.status(status).json({ message: error.message });
    }
  };
  toggleDefaultStock = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    try {
      const { articleId } = req.body;
      const result = await this.stockService.toggleDefaultStock(
        req.user.userId,
        articleId,
      );
      res.json(result);
    } catch (error: any) {
      if (error.message === "DefaultListNotFound") {
        return res
          .status(404)
          .json({ message: "デフォルトリストが設定されていません" });
      }
      res.status(500).json({ message: error.message });
    }
  };

  getIsLiked = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const isLiked = await this.stockService.getIsLiked(
        String(req.params.listId),
        req.user.userId,
      );
      res.json({ isLiked });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  toggleLike = async (req: AuthRequest, res: Response) => {
    try {
      if (!isAuthenticated(req))
        return res.status(401).json({ message: "未ログインです" });
      const result = await this.stockService.toggleLike(
        String(req.params.listId),
        req.user.userId,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getMyAllStockListDetail = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const q = req.query.q as string;
      const lists = await this.stockService.getMyAllStockListDetail(
        req.user.userId,
        page,
        limit,
        q,
      );
      res.json(lists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * リスト詳細（記事一覧）の取得
   */
  getStockListDetail = async (req: AuthRequest, res: Response) => {
    try {
      const listId = String(req.params.listId);
      const userId = (req as AuthRequest).user?.userId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

      const q = req.query.q as string; // 検索クエリ文字列を取得
      const list = await this.stockService.getStockListDetail(
        listId,
        userId,
        page,
        limit,
        q,
      );
      res.json(list);
    } catch (error: any) {
      let status = 500;
      if (error.message === "StockListNotFound") status = 404;
      if (error.message === "Forbidden") status = 403;
      res.status(status).json({ message: error.message });
    }
  };

  /**
   * リストの更新
   */
  updateStockList = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    try {
      const listId = String(req.params.listId);
      const updated = await this.stockService.updateStockList(
        listId,
        req.user.userId,
        req.body,
      );
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * リストの削除
   */
  deleteStockList = async (req: AuthRequest, res: Response) => {
    if (!isAuthenticated(req))
      return res.status(401).json({ message: "未ログインです" });

    try {
      const listId = String(req.params.listId);
      await this.stockService.deleteStockList(listId, req.user.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
