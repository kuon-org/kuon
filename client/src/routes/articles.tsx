import { lazy, Suspense } from "react";
import { createRoute, isRedirect, redirect } from "@tanstack/react-router";
import { layoutWithTopRoute, plainLayoutRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";
import queryClient from "../utils/queryClient";
import { fetchArticle } from "../api/articles";
import { articleKeys } from "../hooks/articles";
import { asUUID } from "../utils/uuid";

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

export const articleRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username/$articleId",
  loader: async ({ params }) => {
    try {
      const validatedId = asUUID(params.articleId);
      const article = await queryClient.ensureQueryData({
        queryKey: articleKeys.detail(validatedId),
        queryFn: () => fetchArticle(validatedId),
      });

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
    } catch (error) {
      console.log("Article Route:", error);
      if (isRedirect(error)) {
        throw error;
      }
    }
  },
});

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

export const articleLikerRoute = createRoute({
  getParentRoute: () => articleRoute,
  path: "liker",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ArticleLiker />
    </Suspense>
  ),
});
