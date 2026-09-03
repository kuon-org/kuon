import { lazy, Suspense } from "react";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutWithTopRoute } from "./__root";
import LoadingSkelton from "../components/common/Loading/LoadingSkelton";

const UserProfile = lazy(() => import("../pages/User/UserProfile"));
const UserTop = lazy(() => import("../pages/User/UserTop").then((mod) => ({ default: mod.UserTop })));
const FollowerList = lazy(() => import("../pages/User/FollowerList").then((mod) => ({ default: mod.FollowerList })));
const FollowingList = lazy(() => import("../pages/User/FollowingList").then((mod) => ({ default: mod.FollowingList })));
const FollowingTagsPage = lazy(() => import("../pages/User/FollowingTagsPage").then((mod) => ({ default: mod.FollowingTagsPage })));
const UserSettings = lazy(() => import("../pages/UserSettings/UserSettings").then((mod) => ({ default: mod.UserSettings })));
const Account = lazy(() => import("../pages/UserSettings/Account").then((mod) => ({ default: mod.Account })));
const AvatarUpload = lazy(() => import("../pages/UserSettings/AvatarUpload").then((mod) => ({ default: mod.AvatarUpload })));
const PublicProfile = lazy(() => import("../pages/UserSettings/PublicProfile").then((mod) => ({ default: mod.PublicProfile })));
const Security = lazy(() => import("../pages/UserSettings/Security").then((mod) => ({ default: mod.Security })));
const TwoFASetting = lazy(() => import("../pages/UserSettings/twoFASetting").then((mod) => ({ default: mod.TwoFASetting })));
const ChangePassword = lazy(() => import("../pages/Auth/ChangePassword"));
const APIKeySettings = lazy(() => import("../pages/UserSettings/APIKeySettings").then((mod) => ({ default: mod.APIKeySettings })));
const UserWebhooks = lazy(() => import("../pages/UserSettings/Webhooks").then((mod) => ({ default: mod.Webhooks })));
const Notifications = lazy(() => import("../pages/UserSettings/Notifications").then((mod) => ({ default: mod.Notifications })));
const UploadedImages = lazy(() => import("../pages/UserSettings/UploadedImages").then((mod) => ({ default: mod.UploadedImages })));
const StockPage = lazy(() => import("../pages/Stock/StockPage").then((mod) => ({ default: mod.StockPage })));
const StockDetail = lazy(() => import("../pages/Stock/StockDetails").then((mod) => ({ default: mod.StockDetail })));

const LoadingFallback = () => <LoadingSkelton />;

export const userRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username",
  component: () => <Suspense fallback={<LoadingFallback />}><UserProfile /></Suspense>,
});

export const userProfileIndexRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "/",
  component: () => <Suspense fallback={<LoadingFallback />}><UserTop /></Suspense>,
});

export const userFollowerRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "follower",
  component: () => <Suspense fallback={<LoadingFallback />}><FollowerList /></Suspense>,
});

export const userFollowingRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "following",
  component: () => <Suspense fallback={<LoadingFallback />}><FollowingList /></Suspense>,
});

export const userFollowingTagsRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "following-tags",
  component: () => <Suspense fallback={<LoadingFallback />}><FollowingTagsPage /></Suspense>,
});

export const userStockRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username/stocks/$listId",
  component: () => <Suspense fallback={<LoadingFallback />}><StockPage /></Suspense>,
});

export const userStockIndexRoute = createRoute({
  getParentRoute: () => userStockRoute,
  path: "/",
  component: () => <Suspense fallback={<LoadingFallback />}><StockDetail /></Suspense>,
});

export const userSettingsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "settings",
  component: () => <Suspense fallback={<LoadingFallback />}><UserSettings /></Suspense>,
  beforeLoad: ({ location, context }) => {
    if (!context.user) throw redirect({ to: "/" });
    if (location.pathname === "/settings" || location.pathname === "/settings/") {
      throw redirect({ to: "/settings/account", replace: true });
    }
  },
});

export const accountSettingRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "account",
  component: () => <Suspense fallback={<LoadingFallback />}><Account /></Suspense>,
});

export const accountCustomImageRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "account/custom-image",
  component: () => <Suspense fallback={<LoadingFallback />}><AvatarUpload /></Suspense>,
});

export const publicProfileRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "profile",
  component: () => <Suspense fallback={<LoadingFallback />}><PublicProfile /></Suspense>,
});

export const securityRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "security",
  component: () => <Suspense fallback={<LoadingFallback />}><Security /></Suspense>,
});

export const passwordSettingRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "password",
  component: () => <Suspense fallback={<LoadingFallback />}><ChangePassword /></Suspense>,
});

export const user2faSettingRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "setup2fa",
  component: () => <Suspense fallback={<LoadingFallback />}><TwoFASetting /></Suspense>,
});

export const apiKeySettingsRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "api-key-settings",
  component: () => <Suspense fallback={<LoadingFallback />}><APIKeySettings /></Suspense>,
});

export const userWebhooksRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "webhooks",
  component: () => <Suspense fallback={<LoadingFallback />}><UserWebhooks /></Suspense>,
});

export const userNotificationsRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "notifications",
  component: () => <Suspense fallback={<LoadingFallback />}><Notifications /></Suspense>,
});

export const uploadedImagesRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "uploaded-images",
  component: () => <Suspense fallback={<LoadingFallback />}><UploadedImages /></Suspense>,
});