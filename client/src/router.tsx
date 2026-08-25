import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthQuery } from "./hooks/useAuth";
import { usePublicServerSettings } from "./hooks/usePublicServerSettings";
import { routeTree } from "./routes";
import { NotFoundComponent } from "./components/Error/NotFoundComponents";
import { GlobalErrorComponent } from "./components/Error/ErrorComponents";
import { MAINTENANCE_MODE_EVENT } from "./api/FetchHttpClient/FetchHttpClient";

/**
 * 新しいrouter定義（Code Splitting版）
 * routes/フォルダのrouteTreeを使用
 */
export const router = createRouter({
  routeTree,
  context: { user: null, requireAuthentication: false, maintenanceMode: false },
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
  const requireAuthentication =
    publicSettings.data?.requireAuthentication ?? false;
  const maintenanceMode = publicSettings.data?.maintenanceMode ?? false;

  useEffect(() => {
    if (user_isLoading || publicSettings.isLoading) return;
    void router.invalidate();
  }, [
    user?.id,
    user?.role,
    requireAuthentication,
    maintenanceMode,
    user_isLoading,
    publicSettings.isLoading,
  ]);

  useEffect(() => {
    const handleMaintenanceDetected = () => {
      void publicSettings.refetch();
    };

    window.addEventListener(MAINTENANCE_MODE_EVENT, handleMaintenanceDetected);
    return () =>
      window.removeEventListener(
        MAINTENANCE_MODE_EVENT,
        handleMaintenanceDetected,
      );
  }, [publicSettings.refetch]);

  if (user_isLoading || publicSettings.isLoading) return null;

  return (
    <RouterProvider
      router={router}
      context={{
        user,
        requireAuthentication,
        maintenanceMode,
      }}
    />
  );
};
