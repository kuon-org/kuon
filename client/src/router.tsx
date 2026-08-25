import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useAuthQuery } from "./hooks/useAuth";
import { usePublicServerSettings } from "./hooks/usePublicServerSettings";
import { routeTree } from "./routes";
import { NotFoundComponent } from "./components/Error/NotFoundComponents";
import { GlobalErrorComponent } from "./components/Error/ErrorComponents";

/**
 * 新しいrouter定義（Code Splitting版）
 * routes/フォルダのrouteTreeを使用
 */
export const router = createRouter({
  routeTree,
  context: { user: null, requireAuthentication: false },
  defaultErrorComponent: GlobalErrorComponent,
  defaultNotFoundComponent: NotFoundComponent,
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
  const publicSettings = usePublicServerSettings();

  if (user_isLoading || publicSettings.isLoading) return null;

  return (
    <RouterProvider
      router={router}
      context={{
        user,
        requireAuthentication:
          publicSettings.data?.requireAuthentication ?? false,
      }}
    />
  );
};
