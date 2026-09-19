import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import Loading from "../components/common/Loading/Loading";
import { layoutWithTopRoute } from "./__root";

const Groups = lazy(() =>
  import("../pages/Groups/Groups").then((module) => ({
    default: module.Groups,
  })),
);
const GroupDetail = lazy(() =>
  import("../pages/Groups/GroupDetail").then((module) => ({
    default: module.GroupDetailPage,
  })),
);
const GroupEdit = lazy(() =>
  import("../pages/Groups/GroupEdit").then((module) => ({
    default: module.GroupEditPage,
  })),
);

export const groupsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "groups",
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  component: () => (
    <Suspense fallback={<Loading />}>
      <Groups />
    </Suspense>
  ),
});

export const groupEditRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "groups/$slug/edit",
  component: () => (
    <Suspense fallback={<Loading />}>
      <GroupEdit />
    </Suspense>
  ),
});

export const groupDetailRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "groups/$slug",
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  component: () => (
    <Suspense fallback={<Loading />}>
      <GroupDetail />
    </Suspense>
  ),
});
