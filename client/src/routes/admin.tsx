import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";

import { plainLayoutRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

// 遅延ローディング対応
const AdminIndex = lazy(() =>
  import("../pages/Admin").then((mod) => ({ default: mod.AdminIndex })),
);
const Security = lazy(() =>
  import("../pages/Admin/Security").then((mod) => ({ default: mod.Security })),
);
const UserManagement = lazy(() =>
  import("../pages/Admin/UserManagement").then((mod) => ({
    default: mod.UserManagement,
  })),
);

const LoadingFallback = () => <Loading />;

/**
 * 管理者ページ（ルート）
 */
export const adminRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "admin",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <AdminIndex />
    </Suspense>
  ),
});

/**
 * 管理者トップ
 */
export const adminTopRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: () => <></>,
});

/**
 * セキュリティ設定
 */
export const adminSecurityRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "security",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Security />
    </Suspense>
  ),
});

/**
 * ユーザーマネジメント
 */
export const adminUserManagementRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "users",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <UserManagement />
    </Suspense>
  ),
});
