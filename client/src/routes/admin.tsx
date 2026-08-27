import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";

import { plainLayoutRoute } from "./__root";
import Loading from "../components/common/Loading/Loading";

const AdminIndex = lazy(() => import("../pages/Admin").then((mod) => ({ default: mod.AdminIndex })));
const Security = lazy(() => import("../pages/Admin/Security").then((mod) => ({ default: mod.Security })));
const ServerSettings = lazy(() => import("../pages/Admin/ServerSettings").then((mod) => ({ default: mod.ServerSettings })));
const UserManagement = lazy(() => import("../pages/Admin/UserManagement").then((mod) => ({ default: mod.UserManagement })));
const RoleManagement = lazy(() => import("../pages/Admin/RoleManagement").then((mod) => ({ default: mod.RoleManagement })));
const BackupRestore = lazy(() => import("../pages/Admin/BackupRestore").then((mod) => ({ default: mod.BackupRestore })));
const Webhooks = lazy(() => import("../pages/Admin/Webhooks").then((mod) => ({ default: mod.Webhooks })));
const LoadingFallback = () => <Loading />;

export const adminRoute = createRoute({ getParentRoute: () => plainLayoutRoute, path: "admin", component: () => <Suspense fallback={<LoadingFallback />}><AdminIndex /></Suspense> });
export const adminTopRoute = createRoute({ getParentRoute: () => adminRoute, path: "/", component: () => <></> });
export const adminSecurityRoute = createRoute({ getParentRoute: () => adminRoute, path: "security", component: () => <Suspense fallback={<LoadingFallback />}><Security /></Suspense> });
export const adminServerSettingsRoute = createRoute({ getParentRoute: () => adminRoute, path: "server-settings", component: () => <Suspense fallback={<LoadingFallback />}><ServerSettings /></Suspense> });
export const adminBackupRestoreRoute = createRoute({ getParentRoute: () => adminRoute, path: "backup-restore", component: () => <Suspense fallback={<LoadingFallback />}><BackupRestore /></Suspense> });
export const adminWebhooksRoute = createRoute({ getParentRoute: () => adminRoute, path: "webhooks", component: () => <Suspense fallback={<LoadingFallback />}><Webhooks /></Suspense> });
export const adminUserManagementRoute = createRoute({ getParentRoute: () => adminRoute, path: "users", component: () => <Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense> });
export const adminRoleManagementRoute = createRoute({ getParentRoute: () => adminRoute, path: "roles", component: () => <Suspense fallback={<LoadingFallback />}><RoleManagement /></Suspense> });
