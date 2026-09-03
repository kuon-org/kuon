import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";

import { plainLayoutRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

const Login = lazy(() => import("../pages/Auth/Login"));
const Register = lazy(() => import("../pages/Auth/Register"));
const VerifyEmail = lazy(() => import("../pages/Auth/VerifyEmail"));
const Login2FA = lazy(async () => {
  const mod = await import("../pages/Auth/Login2FA");
  return { default: mod.Login2FA };
});

const LoadingFallback = () => <Loading />;

export const loginRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "login",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Login />
    </Suspense>
  ),
});

export const login2faRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "login/2fa",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Login2FA />
    </Suspense>
  ),
});

export const registerRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "register",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Register />
    </Suspense>
  ),
});

export const verifyEmailRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "verify-email",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmail />
    </Suspense>
  ),
});
