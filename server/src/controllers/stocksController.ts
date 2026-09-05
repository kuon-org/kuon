import { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { StocksService } from "../services/stocksService.js";
import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";

export class StocksController {
  constructor(private stockService: StocksService) {}

  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  getPublicStockLists = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 12);
      const result = await this.stockService.getPublicStockLists(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Public stock list fetch failed", error);
      throw new AppError(500, "STOCK_LIST_FETCH_FAILED", "Failed to fetch stock lists");
    }
  };

  getMyStockLists = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const articleId = req.query.articleId as string;
      const lists = await this.stockService.getUserStockLists(user.userId, articleId);
      res.json(lists);
    } catch (error) {
      console.error("User stock list fetch failed", error);
      throw new AppError(500, "STOCK_LIST_FETCH_FAILED", "Failed to fetch stock lists");
    }
  };

  createStockList = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const newList = await this.stockService.createStockList(user.userId, req.body);
      res.status(201).json(newList);
    } catch (error) {
      console.error("Stock list creation failed", error);
      throw new AppError(500, "STOCK_LIST_CREATE_FAILED", "Failed to create stock list");
    }
  };

  toggleArticleInList = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const listId = String(req.params.listId);
      const { articleId } = req.body;
      const result = await this.stockService.toggleArticleInStock(
        user.userId,
        listId,
        articleId,
      );
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "StockListNotFound or Unauthorized") {
        throw new AppError(403, "STOCK_LIST_ACCESS_DENIED", "Stock list access denied");
      }
      console.error("Stock list article update failed", error);
      throw new AppError(500, "STOCK_LIST_UPDATE_FAILED", "Failed to update stock list");
    }
  };

  toggleDefaultStock = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const { articleId } = req.body;
      const result = await this.stockService.toggleDefaultStock(user.userId, articleId);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "DefaultListNotFound") {
        throw new AppError(404, "DEFAULT_STOCK_LIST_NOT_FOUND", "Default stock list not found");
      }
      console.error("Default stock update failed", error);
      throw new AppError(500, "STOCK_LIST_UPDATE_FAILED", "Failed to update stock list");
    }
  };

  getIsLiked = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const isLiked = await this.stockService.getIsLiked(
        String(req.params.listId),
        user.userId,
      );
      res.json({ isLiked });
    } catch (error) {
      console.error("Stock list like state fetch failed", error);
      throw new AppError(500, "STOCK_LIKE_STATE_FETCH_FAILED", "Failed to fetch stock like state");
    }
  };

  toggleLike = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const result = await this.stockService.toggleLike(
        String(req.params.listId),
        user.userId,
      );
      res.json(result);
    } catch (error) {
      console.error("Stock list like update failed", error);
      throw new AppError(500, "STOCK_LIKE_UPDATE_FAILED", "Failed to update stock like state");
    }
  };

  getMyAllStockListDetail = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const q = req.query.q as string;
      const lists = await this.stockService.getMyAllStockListDetail(
        user.userId,
        page,
        limit,
        q,
      );
      res.json(lists);
    } catch (error) {
      console.error("Stock list detail fetch failed", error);
      throw new AppError(500, "STOCK_LIST_FETCH_FAILED", "Failed to fetch stock lists");
    }
  };

  getStockListDetail = async (req: AuthRequest, res: Response) => {
    try {
      const listId = String(req.params.listId);
      const userId = req.user?.userId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const q = req.query.q as string;
      const list = await this.stockService.getStockListDetail(
        listId,
        userId,
        page,
        limit,
        q,
      );
      res.json(list);
    } catch (error) {
      if (error instanceof Error && error.message === "StockListNotFound") {
        throw new AppError(404, "STOCK_LIST_NOT_FOUND", "Stock list not found");
      }
      if (error instanceof Error && error.message === "Forbidden") {
        throw new AppError(403, "STOCK_LIST_ACCESS_DENIED", "Stock list access denied");
      }
      console.error("Stock list detail fetch failed", error);
      throw new AppError(500, "STOCK_LIST_FETCH_FAILED", "Failed to fetch stock list");
    }
  };

  updateStockList = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const listId = String(req.params.listId);
      const updated = await this.stockService.updateStockList(listId, user.userId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Stock list update failed", error);
      throw new AppError(500, "STOCK_LIST_UPDATE_FAILED", "Failed to update stock list");
    }
  };

  deleteStockList = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      const listId = String(req.params.listId);
      await this.stockService.deleteStockList(listId, user.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Stock list deletion failed", error);
      throw new AppError(500, "STOCK_LIST_DELETE_FAILED", "Failed to delete stock list");
    }
  };
}
