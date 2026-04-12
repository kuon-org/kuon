import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { layoutWithTopRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

// 遅延ローディング対応
const TagList = lazy(() => import("../pages/TagList/TagList"));
const TagProfile = lazy(() =>
  import("../pages/Tags/TagProfile").then((mod) => ({
    default: mod.TagProfile,
  })),
);
const TagEdit = lazy(() =>
  import("../pages/TagEdit").then((mod) => ({ default: mod.TagEdit })),
);

const LoadingFallback = () => <Loading />;

/**
 * タグ一覧
 */
export const tagsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "tags",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <TagList />
    </Suspense>
  ),
});

/**
 * タグプロフィール（詳細）
 */
export const tagProfileRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "tags/$slug",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page) || 1,
    };
  },
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <TagProfile />
    </Suspense>
  ),
});

/**
 * タグ編集
 */
export const tagEditRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "tags/$slug/edit",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <TagEdit />
    </Suspense>
  ),
});
