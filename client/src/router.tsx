import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Box } from "@mui/material";

import TopBar from "./components/layouts/TopBar/TopBar";
import TabsBar from "./components/layouts/TopBar/TabsBar";
import LeftSection from "./components/layouts/SideSection/LeftSection";
import RightSection from "./components/layouts/SideSection/RightSection";

import Home from "./pages/Home/Home";
import TagList from "./pages/TagList/TagList";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import UserProfile from "./pages/User/UserProfile";
import { ArticleLayout } from "./pages/Articles/ArticlesLayout";

import { useAuthQuery } from "./hooks/useAuth";
import { ArticleLiker } from "./pages/Articles/ArticleLiker";
import { Edit } from "./pages/Editor/Edit";
import { New } from "./pages/Editor/New";
import { ArticleList } from "./pages/User/Articlelist";
import { FollowerList } from "./pages/User/FollowerList";
import { FollowingList } from "./pages/User/FollowingList";
import { Drafts } from "./pages/Drafts/Drafts";
import { UserSettings } from "./pages/UserSettings/UserSettings";
import { TwoFASetting } from "./pages/UserSettings/twoFASetting";
import { Login2FA } from "./pages/Auth/Login2FA";
import { UploadedImages } from "./pages/UserSettings/UploadedImages";
import { Account } from "./pages/UserSettings/Account";
import { PublicProfile } from "./pages/UserSettings/PublicProfile";
import { Footer } from "./components/layouts/Footer/Footer";
import { AvatarUpload } from "./pages/UserSettings/AvatarUpload";
import { AdminIndex } from "./pages/Admin";
import { Security } from "./pages/Admin/Security";
import { UserManagement } from "./pages/Admin/UserManagement";
import { TagProfile } from "./pages/Tags/TagProfile";
import { Trash } from "./pages/Trash/Trash";
import { SearchPage } from "./pages/Search/SearchPage";
import { StocksLayout } from "./pages/Stock/StockLayout";
import { StockDetail } from "./pages/Stock/StockDetails";
import { PublicStocksPage } from "./pages/Stock/StockList";
import { StockPage } from "./pages/Stock/StockPage";
import { StockEditWrapper } from "./pages/Stock/StockEditWrapper";
import { NotificationManager } from "./components/common/NotificationManager";

interface MyRouterContext {
  user: { id: string; username: string } | null;
}

/* ------------------------------
   1️⃣ 完全に素のルート（最上位）
   ------------------------------ */
const baseRootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <NotificationManager />
      <Outlet />
      {/* <TanStackRouterDevtools initialIsOpen={false} /> */}
    </>
  ),
});

/* ------------------------------
   2️⃣ TopBar + TabsBar 付きレイアウト
   ------------------------------ */
const layoutWithTopRoute = createRoute({
  getParentRoute: () => baseRootRoute,
  id: "layout-with-top",
  component: () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <TopBar />
      <TabsBar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  ),
});

/* ------------------------------
   3️⃣ サイドバー付きレイアウト
   ------------------------------ */
const sidebarLayoutRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  id: "layout-with-sidebar",
  component: () => (
    <Box sx={{ display: "flex" }}>
      <LeftSection />
      <Box sx={{ flex: 1, py: 3, px: { sm: 0, md: 3 } }}>
        <Outlet />
      </Box>
      <RightSection />
    </Box>
  ),
});

/* ------------------------------
   4️⃣ 完全に素のレイアウト（TopBarもSidebarもなし）
   ------------------------------ */
const plainLayoutRoute = createRoute({
  getParentRoute: () => baseRootRoute,
  id: "layout-plain",
  component: () => (
    <Box>
      <Outlet />
    </Box>
  ),
});

export const adminRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "admin",
  component: AdminIndex,
});

export const adminTopRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: () => <></>,
});

export const adminSecurityRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "security",
  component: Security,
});

export const adminUserManagementRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "users",
  component: UserManagement,
});
/* ------------------------------
   検索ページルート
   ------------------------------ */
export const searchRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute, // TopBarがあるレイアウトを継承
  path: "/search",
  // URLクエリパラメータの型定義
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
      page: Number(search.page) || 1,
    };
  },
  component: SearchPage, // 先ほど作成したSearchPageコンポーネント
});
/* ------------------------------
   5️⃣ ページルート
   ------------------------------ */

// 🏠 Home（サイド付き）
const indexRoute = createRoute({
  getParentRoute: () => sidebarLayoutRoute,
  path: "/",
  component: Home,
  loader: () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
});

const stockListRoute = createRoute({
  getParentRoute: () => sidebarLayoutRoute,
  path: "stock-feed",
  component: PublicStocksPage,
  loader: () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
});

// ℹ️ Trend（サイド付き）
const trendRoute = createRoute({
  getParentRoute: () => sidebarLayoutRoute,
  path: "trend",
  component: () => <div>トレンド</div>,
});

// ℹ️ Trend（サイド付き）
const timelineRoute = createRoute({
  getParentRoute: () => sidebarLayoutRoute,
  path: "timeline",
  component: () => <div>タイムライン</div>,
});

// 🧑‍💻 ユーザー関連（サイド付き）
export const userRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username",
  component: UserProfile,
});

export const userProfileIndexRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "/",
  component: ArticleList,
});

export const userFollowerRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "follower",
  component: FollowerList,
});

export const userFollowingRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "following",
  component: FollowingList,
});

export const articleRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username/$articleId",
  // component を定義しない場合、自動的に <Outlet /> が描画されます
});

export const userStockRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "$username/stocks/$listId",
  component: StockPage,
});

const userStockIndexRoute = createRoute({
  getParentRoute: () => userStockRoute,
  path: "/",
  component: StockDetail,
});

// 2. 「記事詳細」そのものの表示内容をインデックスルートにする
const articleIndexRoute = createRoute({
  getParentRoute: () => articleRoute,
  path: "/", // これで /user/$username/$articleId にマッチする
  component: ArticleLayout,
  loader: () => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
});

// 3. 「Liker」はそのまま子ルートとして定義
export const articleLikerRoute = createRoute({
  getParentRoute: () => articleRoute,
  path: "liker", // /user/$username/$articleId/liker にマッチする
  component: ArticleLiker,
});

const trashRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "trash",
  component: Trash,
});
export const draftsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "drafts",
  component: Drafts,
});

// ✏️ 記事作成ページ（TopBar付き・サイドなし）
export const articleCreateRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "drafts/new",
  component: New,
});

export const articleEditRoute = createRoute({
  getParentRoute: () => plainLayoutRoute, // これで plain (TopBarなし) になる
  path: "drafts/$articleId/edit", // フルパスを指定
  component: Edit,
});
const stockSearchSchema = (search: Record<string, unknown>) => ({
  page: Number(search.page) || 1,
  q: (search.q as string) || undefined, // q が空なら undefined にして URL をスッキリさせる
});
export const stocksRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "stocks",
  component: StocksLayout,
});

// 2. 🆕 インデックスルート ( / stocks 直下)
export const stocksIndexRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "/",
  validateSearch: stockSearchSchema,
  component: StockDetail,
});

// 3. 新規作成
export const stocksNewRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "/new",
  component: StockEditWrapper,
});

// 4. 個別詳細
export const stocksDetailsRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "$listId",
  validateSearch: stockSearchSchema,
  component: StockDetail,
});

export const stockEditRoute = createRoute({
  getParentRoute: () => stocksRoute,
  path: "$listId/edit",
  component: StockEditWrapper,
});

export const userSettingsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "settings",
  component: UserSettings,
  beforeLoad: ({ location }) => {
    if (
      location.pathname === "/settings" ||
      location.pathname === "/settings/"
    ) {
      throw redirect({
        to: "/settings/account",
        replace: true, // 戻るボタンでまたリダイレクトされるのを防ぐ
      });
    }
  },
});

export const accountSettingRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "account",
  component: Account,
});

export const accountCustomImageRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "account/custom_image",
  component: AvatarUpload,
});

export const publicProfileRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "profile",
  component: PublicProfile,
});
export const user2faSettingRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "setup2fa",
  component: TwoFASetting,
});

export const uploadedImagesRoute = createRoute({
  getParentRoute: () => userSettingsRoute,
  path: "uploaded_images",
  component: UploadedImages,
});

// 🏷️ タグ一覧（TopBar付き・サイドなし）
const tagsRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "tags",
  component: () => (
    <Box sx={{ p: 3 }}>
      <TagList />
    </Box>
  ),
});

export const tagProfileRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  path: "tags/$slug",
  component: TagProfile,
});

// 🔐 ログイン / 登録（完全に素）
const loginRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "login",
  component: Login,
});

const login2faRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "login/2fa",
  component: Login2FA,
});

const registerRoute = createRoute({
  getParentRoute: () => plainLayoutRoute,
  path: "register",
  component: Register,
});

/* ------------------------------
   6️⃣ ルートツリー構築
   ------------------------------ */
const routeTree = baseRootRoute.addChildren([
  plainLayoutRoute.addChildren([
    loginRoute,
    login2faRoute,
    registerRoute,
    articleCreateRoute,
    articleEditRoute,
    adminRoute.addChildren([
      adminTopRoute,
      adminSecurityRoute,
      adminUserManagementRoute,
    ]),
  ]),
  layoutWithTopRoute.addChildren([
    sidebarLayoutRoute.addChildren([
      indexRoute,
      searchRoute,
      stockListRoute,
      timelineRoute,
      trendRoute,
    ]),
    stocksRoute.addChildren([
      stocksIndexRoute,
      stocksNewRoute,
      stocksDetailsRoute,
      stockEditRoute,
    ]),
    tagsRoute,
    tagProfileRoute,
    articleRoute.addChildren([articleIndexRoute, articleLikerRoute]),
    userStockRoute.addChildren([userStockIndexRoute]),
    userSettingsRoute.addChildren([
      accountSettingRoute,
      accountCustomImageRoute,
      publicProfileRoute,
      user2faSettingRoute,
      uploadedImagesRoute,
    ]),
    draftsRoute,
    trashRoute,
    userRoute.addChildren([
      userProfileIndexRoute,
      userFollowerRoute,
      userFollowingRoute,
    ]),
  ]),
]);

/* ------------------------------
   7️⃣ Router生成と型登録
   ------------------------------ */
export const router = createRouter({
  routeTree,
  context: { user: null },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/* ------------------------------
   8️⃣ Routerプロバイダ
   ------------------------------ */
export const AppRouter = () => {
  const { user, user_isLoading } = useAuthQuery();

  if (user_isLoading) return null;

  return <RouterProvider router={router} context={{ user }} />;
};
