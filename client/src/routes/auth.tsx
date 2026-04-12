import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";

import { plainLayoutRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

// 遅延ローディング対応
const Login = lazy(() => import("../pages/Auth/Login"));
const Register = lazy(() => import("../pages/Auth/Register"));
const Login2FA = lazy(async () => {
  const mod = await import("../pages/Auth/Login2FA");
  return { default: mod.Login2FA };
});

const LoadingFallback = () => <Loading />;

/**
 * ログイン
 */
export const loginRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "login",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Login />
    </Suspense>
  ),
});

/**
 * ログイン（2FA）
 */
export const login2faRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "login/2fa",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Login2FA />
    </Suspense>
  ),
});

/**
 * 登録
 */
export const registerRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "register",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Register />
    </Suspense>
  ),
});
