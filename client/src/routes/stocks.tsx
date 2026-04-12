import { lazy, Suspense } from "react";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutWithTopRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

// 遅延ローディング対応
const StocksLayout = lazy(() =>
  import("../pages/Stock/StockLayout").then((mod) => ({
    default: mod.StocksLayout,
  })),
);
const StockDetail = lazy(() =>
  import("../pages/Stock/StockDetails").then((mod) => ({
    default: mod.StockDetail,
  })),
);
const StockEditWrapper = lazy(() =>
  import("../pages/Stock/StockEditWrapper").then((mod) => ({
    default: mod.StockEditWrapper,
  })),
);
const PublicStocksPage = lazy(() =>
  import("../pages/Stock/StockList").then((mod) => ({
    default: mod.PublicStocksPage,
  })),
);

const LoadingFallback = () => <Loading />;

const stockSearchSchema = (search: Record<string, unknown>) => ({
  page: Number(search.page) || 1,
  q: (search.q as string) || undefined,
});

/**
 * 公開ストックリストフィード
 */
export const stockListRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "stock-feed",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <PublicStocksPage />
    </Suspense>
  ),
  loader: () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
});

/**
 * ストックリスト管理（親ルート）
 */
export const stocksRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "stocks",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StocksLayout />
    </Suspense>
  ),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/" });
    }
  },
});

/**
 * ストックリスト管理（インデックス）
 */
export const stocksIndexRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "/",
  validateSearch: stockSearchSchema,
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StockDetail />
    </Suspense>
  ),
});

/**
 * ストックリスト新規作成
 */
export const stocksNewRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "/new",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StockEditWrapper />
    </Suspense>
  ),
});

/**
 * ストックリスト詳細
 */
export const stocksDetailsRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "$listId",
  validateSearch: stockSearchSchema,
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StockDetail />
    </Suspense>
  ),
});

/**
 * ストックリスト編集
 */
export const stockEditRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "$listId/edit",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StockEditWrapper />
    </Suspense>
  ),
});
