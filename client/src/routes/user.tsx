import { lazy, Suspense } from "react";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutWithTopRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

// 遅延ローディング対応
const UserProfile = lazy(() => import("../pages/User/UserProfile"));
const UserTop = lazy(() =>
  import("../pages/User/UserTop").then((mod) => ({ default: mod.UserTop })),
);
const FollowerList = lazy(() =>
  import("../pages/User/FollowerList").then((mod) => ({
    default: mod.FollowerList,
  })),
);
const FollowingList = lazy(() =>
  import("../pages/User/FollowingList").then((mod) => ({
    default: mod.FollowingList,
  })),
);
const FollowingTagsPage = lazy(() =>
  import("../pages/User/FollowingTagsPage").then((mod) => ({
    default: mod.FollowingTagsPage,
  })),
);
const UserSettings = lazy(() =>
  import("../pages/UserSettings/UserSettings").then((mod) => ({
    default: mod.UserSettings,
  })),
);
const Account = lazy(() =>
  import("../pages/UserSettings/Account").then((mod) => ({
    default: mod.Account,
  })),
);
const AvatarUpload = lazy(() =>
  import("../pages/UserSettings/AvatarUpload").then((mod) => ({
    default: mod.AvatarUpload,
  })),
);
const PublicProfile = lazy(() =>
  import("../pages/UserSettings/PublicProfile").then((mod) => ({
    default: mod.PublicProfile,
  })),
);
const TwoFASetting = lazy(() =>
  import("../pages/UserSettings/twoFASetting").then((mod) => ({
    default: mod.TwoFASetting,
  })),
);
const UploadedImages = lazy(() =>
  import("../pages/UserSettings/UploadedImages").then((mod) => ({
    default: mod.UploadedImages,
  })),
);
const StockPage = lazy(() =>
  import("../pages/Stock/StockPage").then((mod) => ({
    default: mod.StockPage,
  })),
);
const StockDetail = lazy(() =>
  import("../pages/Stock/StockDetails").then((mod) => ({
    default: mod.StockDetail,
  })),
);

const LoadingFallback = () => <Loading />;

/**
 * ユーザープロフィール（親ルート）
 */
export const userRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <UserProfile />
    </Suspense>
  ),
});

/**
 * ユーザープロフィール（インデックス）
 */
export const userProfileIndexRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <UserTop />
    </Suspense>
  ),
});

/**
 * フォロワー一覧
 */
export const userFollowerRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "follower",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <FollowerList />
    </Suspense>
  ),
});

/**
 * フォロー中一覧
 */
export const userFollowingRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "following",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <FollowingList />
    </Suspense>
  ),
});

/**
 * フォロー中のタグ
 */
export const userFollowingTagsRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "following_tags",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <FollowingTagsPage />
    </Suspense>
  ),
});

/**
 * ユーザーのストックリスト
 */
export const userStockRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username/stocks/$listId",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StockPage />
    </Suspense>
  ),
});

/**
 * ユーザーのストックリスト詳細
 */
export const userStockIndexRoute = createRoute({
  getParentRoute: () => userStockRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StockDetail />
    </Suspense>
  ),
});

/**
 * ユーザー設定（親ルート）
 */
export const userSettingsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "settings",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <UserSettings />
    </Suspense>
  ),
  beforeLoad: ({ location, context }) => {
    if (!context.user) {
      throw redirect({ to: "/" });
    }
    if (
      location.pathname === "/settings" ||
      location.pathname === "/settings/"
    ) {
      throw redirect({
        to: "/settings/account",
        replace: true,
      });
    }
  },
});

/**
 * アカウント設定
 */
export const accountSettingRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "account",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <Account />
    </Suspense>
  ),
});

/**
 * アバター画像カスタマイズ
 */
export const accountCustomImageRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "account/custom_image",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <AvatarUpload />
    </Suspense>
  ),
});

/**
 * プロフィール公開設定
 */
export const publicProfileRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "profile",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <PublicProfile />
    </Suspense>
  ),
});

/**
 * 2FA設定
 */
export const user2faSettingRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "setup2fa",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <TwoFASetting />
    </Suspense>
  ),
});

/**
 * アップロード済み画像
 */
export const uploadedImagesRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "uploaded_images",
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <UploadedImages />
    </Suspense>
  ),
});
