import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { sidebarLayoutRoute, layoutWithTopRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

// 遅延ローディング対応
const Home = lazy(() => import("../pages/Home/Home"));
const Trends = lazy(() => import("../pages/Trends/Trends"));
const Timeline = lazy(() => import("../pages/Timeline/Timeline"));
const SearchPage = lazy(() =>
  import("../pages/Search/SearchPage").then((mod) => ({
    default: mod.SearchPage,
  })),
);

const LoadingFallback = () => <Loading />;

/**
 * ホーム
 */
export const indexRoute = createRoute({
  getParentRoute: () => sidebarLayoutRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Home />
    </Suspense>
  ),
  loader: () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
});

/**
 * トレンド
 */
export const trendRoute = createRoute({
  getParentRoute: () => sidebarLayoutRoute,
  path: "trend",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Trends />
    </Suspense>
  ),
});

/**
 * タイムライン
 */
export const timelineRoute = createRoute({
  getParentRoute: () => sidebarLayoutRoute,
  path: "timeline",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Timeline />
    </Suspense>
  ),
});

/**
 * 検索
 */
export const searchRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "/search",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
      page: Number(search.page) || 1,
    };
  },
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <SearchPage />
    </Suspense>
  ),
});
