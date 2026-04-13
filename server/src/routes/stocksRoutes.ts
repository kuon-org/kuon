import { Router } from "express";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import { StocksRepository } from "../repositories/stocksRepository.js";
import { StocksService } from "../services/stocksService.js";
import { StocksController } from "../controllers/stocksController.js";

/**
 * ストックリスト用ルート
 */
const stockRouter = Router();

// インスタンス化 (Dependency Injection)

const stockRepo = new StocksRepository();
const stockService = new StocksService(stockRepo);
const stockCtrl = new StocksController(stockService);

/**
 * @openapi
 * /api/stocks/lists:
 *   get:
 *     summary: 公開ストックリスト一覧を取得
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12, maximum: 50 }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lists: { type: array, items: { $ref: '#/components/schemas/StockList' } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
stockRouter.get("/stocks/lists", optionalAuth, stockCtrl.getPublicStockLists);

/**
 * @openapi
 * /api/stocks/mylists:
 *   get:
 *     summary: ユーザーのストックリスト一覧を取得
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: articleId
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/StockList' }
 *       '401':
 *         description: 未ログイン
 */
stockRouter.get(
  "/stocks/mylists",
  authenticateToken,
  stockCtrl.getMyStockLists,
);

/**
 * @openapi
 * /api/stocks/alllists:
 *   get:
 *     summary: ユーザーの全ストックリスト詳細を取得
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lists: { type: array, items: { $ref: '#/components/schemas/StockListDetail' } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       '401':
 *         description: 未ログイン
 */
stockRouter.get(
  "/stocks/alllists",
  authenticateToken,
  stockCtrl.getMyAllStockListDetail,
);

/**
 * @openapi
 * /api/stocks/lists:
 *   post:
 *     summary: ストックリストの新規作成
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               isPublic: { type: boolean }
 *     responses:
 *       '201':
 *         description: 作成成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StockList' }
 *       '401':
 *         description: 未ログイン
 */
stockRouter.post("/stocks/lists", authenticateToken, stockCtrl.createStockList);

/**
 * @openapi
 * /api/stocks/lists/{listId}/articles:
 *   post:
 *     summary: リストへの記事追加/削除のトグル
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articleId: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 added: { type: boolean }
 *       '401':
 *         description: 未ログイン
 *       '403':
 *         description: 権限なし
 */
stockRouter.post(
  "/stocks/lists/:listId/articles",
  authenticateToken,
  stockCtrl.toggleArticleInList,
);

/**
 * @openapi
 * /api/stocks/default/articles:
 *   post:
 *     summary: デフォルトストックへの記事追加/削除のトグル
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articleId: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 added: { type: boolean }
 *       '401':
 *         description: 未ログイン
 *       '404':
 *         description: デフォルトリストなし
 */
stockRouter.post(
  "/stocks/default/articles",
  authenticateToken,
  stockCtrl.toggleDefaultStock,
);

/**
 * @openapi
 * /api/stocks/lists/{listId}:
 *   get:
 *     summary: ストックリスト詳細を取得
 *     tags:
 *       - Stocks
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StockListDetail' }
 *       '403':
 *         description: 権限なし
 *       '404':
 *         description: 見つかりません
 */
stockRouter.get(
  "/stocks/lists/:listId",
  optionalAuth,
  stockCtrl.getStockListDetail,
);

/**
 * @openapi
 * /api/stocks/lists/{listId}:
 *   patch:
 *     summary: ストックリストの更新
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               isPublic: { type: boolean }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StockList' }
 *       '401':
 *         description: 未ログイン
 */
stockRouter.patch(
  "/stocks/lists/:listId",
  authenticateToken,
  stockCtrl.updateStockList,
);

/**
 * @openapi
 * /api/stocks/lists/{listId}:
 *   delete:
 *     summary: ストックリストの削除
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204':
 *         description: 削除成功
 *       '401':
 *         description: 未ログイン
 */
stockRouter.delete(
  "/stocks/lists/:listId",
  authenticateToken,
  stockCtrl.deleteStockList,
);

/**
 * @openapi
 * /api/stocks/lists/{listId}/like:
 *   post:
 *     summary: ストックリストのいいねトグル
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked: { type: boolean }
 *       '401':
 *         description: 未ログイン
 */
stockRouter.post(
  "/stocks/lists/:listId/like",
  authenticateToken,
  stockCtrl.toggleLike,
);

/**
 * @openapi
 * /api/stocks/lists/{listId}/islike:
 *   get:
 *     summary: ストックリストのいいね状態を取得
 *     tags:
 *       - Stocks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLiked: { type: boolean }
 *       '401':
 *         description: 未ログイン
 */
stockRouter.get(
  "/stocks/lists/:listId/islike",
  authenticateToken,
  stockCtrl.getIsLiked,
);

export default stockRouter;
