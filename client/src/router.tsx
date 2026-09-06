import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthUserQuery } from "./hooks/auth";
import { useAdminPermissions } from "./hooks/useRoles";
import { usePublicServerSettings } from "./hooks/usePublicServerSettings";
import { routeTree } from "./routes";
import { NotFoundComponent } from "./components/Error/NotFoundComponents";
import { GlobalErrorComponent } from "./components/Error/ErrorComponents";
import { MAINTENANCE_MODE_EVENT } from "./api/FetchHttpClient/FetchHttpClient";

export const router = createRouter({
  routeTree,
  context: {
    user: null,
    permissions: [],
    requireAuthentication: false,
    maintenanceMode: false,
  },
  defaultErrorComponent: GlobalErrorComponent,
  defaultNotFoundComponent: NotFoundComponent,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const AppRouter = () => {
  const authUserQuery = useAuthUserQuery();
  const user = authUserQuery.data;
  const { permissions, permissions_isLoading } = useAdminPermissions(!!user);
  const publicSettings = usePublicServerSettings();
  const requireAuthentication =
    publicSettings.data?.requireAuthentication ?? false;
  const maintenanceMode = publicSettings.data?.maintenanceMode ?? false;

  useEffect(() => {
    if (authUserQuery.isLoading || permissions_isLoading || publicSettings.isLoading) return;
    void router.invalidate();
  }, [
    user?.id,
    permissions.join("|"),
    requireAuthentication,
    maintenanceMode,
    authUserQuery.isLoading,
    permissions_isLoading,
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

  if (authUserQuery.isLoading || permissions_isLoading || publicSettings.isLoading) return null;

  return (
    <RouterProvider
      router={router}
      context={{
        user,
        permissions,
        requireAuthentication,
        maintenanceMode,
      }}
    />
  );
};
