import {
  createRootRouteWithContext,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Box, Divider } from "@mui/material";

import TopBar from "../components/layouts/TopBar/TopBar";
import TabsBar from "../components/layouts/TopBar/TabsBar";
import LeftSection from "../components/layouts/SideSection/LeftSection";
import RightSection from "../components/layouts/SideSection/RightSection";
import { Footer } from "../components/layouts/Footer/Footer";
import { NotificationManager } from "../components/common/NotificationManager";
import { TagLists } from "../components/Tag/TagLists";
import { Ranking } from "../components/Ranking";

export interface MyRouterContext {
  user: { id: string; username: string } | null;
  requireAuthentication: boolean;
}

const anonymousRoutes = new Set(["/login", "/login/2fa", "/register"]);

/**
 * 完全に素のルート（最上位）
 */
export const baseRootRoute = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: ({ context, location }) => {
    const isAnonymousRoute = anonymousRoutes.has(location.pathname);

    if (context.user && isAnonymousRoute) {
      throw redirect({ to: "/" });
    }

    if (
      context.requireAuthentication &&
      !context.user &&
      !isAnonymousRoute
    ) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <>
      <NotificationManager />
      <Outlet />
      <TanStackRouterDevtools initialIsOpen={false} />
    </>
  ),
});

/**
 * TopBar + TabsBar 付きレイアウト
 */
export const layoutWithTopRoute = createRoute({
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

/**
 * サイドバー付きレイアウト
 */
export const sidebarLayoutRoute = createRoute({
  getParentRoute: () => layoutWithTopRoute,
  id: "layout-with-sidebar",
  component: () => (
    <Box sx={{ display: "flex" }}>
      <LeftSection>
        <TagLists />
        <Divider sx={{ py: 1 }} />
        <Ranking />
      </LeftSection>
      <Box sx={{ flex: 1, py: 3, px: { sm: 0, md: 3 } }}>
        <Outlet />
      </Box>
      <RightSection />
    </Box>
  ),
});

/**
 * 完全に素のレイアウト（TopBarもSidebarもなし）
 */
export const plainLayoutRoute = createRoute({
  getParentRoute: () => baseRootRoute,
  id: "layout-plain",
  component: () => (
    <Box>
      <Outlet />
    </Box>
  ),
});
