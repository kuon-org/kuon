import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useAuthQuery } from "./hooks/useAuth";
import { routeTree } from "./routes";

/**
 * 新しいrouter定義（Code Splitting版）
 * routes/フォルダのrouteTreeを使用
 */
export const router = createRouter({
  routeTree,
  context: { user: null },
});

// 型登録
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * RouterProvider
 */
export const AppRouter = () => {
  const { user, user_isLoading } = useAuthQuery();

  if (user_isLoading) return null;

  return <RouterProvider router={router} context={{ user }} />;
};
