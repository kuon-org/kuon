import { Router } from "express";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import { StocksRepository } from "../repositories/stocksRepository.js";
import { StocksService } from "../services/stocksService.js";
import { StocksController } from "../controllers/stocksController.js";

const stockRouter = Router();

// インスタンス化 (Dependency Injection)
const stockRepo = new StocksRepository();
const stockService = new StocksService(stockRepo);
const stockCtrl = new StocksController(stockService);

stockRouter.get("/stocks/lists", optionalAuth, stockCtrl.getPublicStockLists);
stockRouter.get(
  "/stocks/mylists",
  authenticateToken,
  stockCtrl.getMyStockLists,
);
stockRouter.get(
  "/stocks/alllists",
  authenticateToken,
  stockCtrl.getMyAllStockListDetail,
);
stockRouter.post("/stocks/lists", authenticateToken, stockCtrl.createStockList);

stockRouter.post(
  "/stocks/lists/:listId/articles",
  authenticateToken,
  stockCtrl.toggleArticleInList,
);

stockRouter.post(
  "/stocks/default/articles",
  authenticateToken,
  stockCtrl.toggleDefaultStock,
);

stockRouter.get(
  "/stocks/lists/:listId",
  optionalAuth,
  stockCtrl.getStockListDetail,
);

stockRouter.patch(
  "/stocks/lists/:listId",
  authenticateToken,
  stockCtrl.updateStockList,
);

stockRouter.delete(
  "/stocks/lists/:listId",
  authenticateToken,
  stockCtrl.deleteStockList,
);

stockRouter.post(
  "/stocks/lists/:listId/like",
  authenticateToken,
  stockCtrl.toggleLike,
);

stockRouter.get(
  "/stocks/lists/:listId/islike",
  authenticateToken,
  stockCtrl.getIsLiked,
);

export default stockRouter;
