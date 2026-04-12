import { lazy, Suspense } from "react";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutWithTopRoute, plainLayoutRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";
import { queryClient } from "../utils/queryClient";
import apiClient from "../api/client";
import type { Article } from "../hooks/useArticles";

// 遅延ローディング対応
const New = lazy(() =>
  import("../pages/Editor/New").then((mod) => ({ default: mod.New })),
);
const Edit = lazy(() =>
  import("../pages/Editor/Edit").then((mod) => ({ default: mod.Edit })),
);
const ArticleLayout = lazy(() =>
  import("../pages/Articles/ArticlesLayout").then((mod) => ({
    default: mod.ArticleLayout,
  })),
);
const ArticleLiker = lazy(() =>
  import("../pages/Articles/ArticleLiker").then((mod) => ({
    default: mod.ArticleLiker,
  })),
);
const Drafts = lazy(() =>
  import("../pages/Drafts/Drafts").then((mod) => ({ default: mod.Drafts })),
);
const Trash = lazy(() =>
  import("../pages/Trash/Trash").then((mod) => ({ default: mod.Trash })),
);

const LoadingFallback = () => <Loading />;

/**
 * 新規記事作成
 */
export const articleCreateRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "drafts/new",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <New />
    </Suspense>
  ),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/" });
    }
  },
});

/**
 * 記事編集
 */
export const articleEditRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "drafts/$articleId/edit",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Edit />
    </Suspense>
  ),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/" });
    }
  },
});

/**
 * ドラフト一覧
 */
export const draftsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "drafts",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Drafts />
    </Suspense>
  ),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/" });
    }
  },
});

/**
 * ゴミ箱
 */
export const trashRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "trash",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Trash />
    </Suspense>
  ),
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/" });
    }
  },
});

/**
 * 記事詳細（親ルート）
 */
export const articleRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username/$articleId",
  loader: async ({ params }) => {
    // コンポーネント内のuseQueryと同じKey、同じロジックでデータを取得
    const article = await queryClient.ensureQueryData({
      queryKey: ["article", params.articleId],
      queryFn: async () => {
        const { data } = await apiClient.get<Article>(
          `/articles/${params.articleId}`,
        );
        return data;
      },
    });

    // ユーザー名チェック
    if (article.users.username !== params.username) {
      throw redirect({
        to: "/$username/$articleId",
        params: {
          username: article.users.username,
          articleId: article.id,
        },
        replace: true,
      });
    }

    return { article };
  },
});

/**
 * 記事詳細（インデックス）
 */
export const articleIndexRoute = createRoute({
  getParentRoute: () => articleRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ArticleLayout />
    </Suspense>
  ),
  loader: () => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
});

/**
 * 記事のLiker一覧
 */
export const articleLikerRoute = createRoute({
  getParentRoute: () => articleRoute,
  path: "liker",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ArticleLiker />
    </Suspense>
  ),
});
