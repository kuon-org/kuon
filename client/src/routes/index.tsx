/**
 * ルート定義の統合ファイル
 * 全ルートをここで組み立てます
 */

import {
  baseRootRoute,
  layoutWithTopRoute,
  sidebarLayoutRoute,
  plainLayoutRoute,
} from "./__root";

import { loginRoute, login2faRoute, registerRoute } from "./auth";
import { maintenanceRoute } from "./maintenance";

import {
  adminRoute,
  adminTopRoute,
  adminSecurityRoute,
  adminServerSettingsRoute,
  adminBackupRestoreRoute,
  adminUserManagementRoute,
} from "./admin";

import {
  articleCreateRoute,
  articleEditRoute,
  draftsRoute,
  trashRoute,
  articleRoute,
  articleIndexRoute,
  articleLikerRoute,
} from "./articles";

import {
  userRoute,
  userProfileIndexRoute,
  userFollowerRoute,
  userFollowingRoute,
  userFollowingTagsRoute,
  userStockRoute,
  userStockIndexRoute,
  userSettingsRoute,
  accountSettingRoute,
  accountCustomImageRoute,
  publicProfileRoute,
  user2faSettingRoute,
  uploadedImagesRoute,
  securityRoute,
  apiKeySettingsRoute,
} from "./user";

import {
  stockListRoute,
  stocksRoute,
  stocksIndexRoute,
  stocksNewRoute,
  stocksDetailsRoute,
  stockEditRoute,
} from "./stocks";

import { tagsRoute, tagProfileRoute, tagEditRoute } from "./tags";

import { indexRoute, searchRoute, trendRoute, timelineRoute } from "./home";

/**
 * ルートツリーを構築
 */
export const routeTree = baseRootRoute.addChildren([
  // plainLayout配下（認証・管理者・記事作成編集など）
  plainLayoutRoute.addChildren([
    loginRoute,
    login2faRoute,
    registerRoute,
    maintenanceRoute,
    articleCreateRoute,
    articleEditRoute,
    adminRoute.addChildren([
      adminTopRoute,
      adminSecurityRoute,
      adminServerSettingsRoute,
      adminBackupRestoreRoute,
      adminUserManagementRoute,
    ]),
  ]),

  // layoutWithTopRoute配下
  layoutWithTopRoute.addChildren([
    // sidebarLayout配下
    sidebarLayoutRoute.addChildren([
      indexRoute,
      searchRoute,
      stockListRoute,
      timelineRoute,
      trendRoute,
    ]),

    // TopBar直下のルート
    stocksRoute.addChildren([
      stocksIndexRoute,
      stocksNewRoute,
      stocksDetailsRoute,
      stockEditRoute,
    ]),
    tagsRoute,
    tagProfileRoute,
    tagEditRoute,
    articleRoute.addChildren([articleIndexRoute, articleLikerRoute]),
    userStockRoute.addChildren([userStockIndexRoute]),
    userSettingsRoute.addChildren([
      accountSettingRoute,
      accountCustomImageRoute,
      publicProfileRoute,
      securityRoute,
      user2faSettingRoute,
      apiKeySettingsRoute,
      uploadedImagesRoute,
    ]),
    draftsRoute,
    trashRoute,
    userRoute.addChildren([
      userProfileIndexRoute,
      userFollowerRoute,
      userFollowingRoute,
      userFollowingTagsRoute,
    ]),
  ]),
]);

// 全ルートを一括export
export {
  baseRootRoute,
  layoutWithTopRoute,
  sidebarLayoutRoute,
  plainLayoutRoute,
} from "./__root";
export type { MyRouterContext } from "./__root";

export * from "./auth";
export * from "./admin";
export * from "./articles";
export * from "./user";
export * from "./stocks";
export * from "./tags";
export * from "./home";
export * from "./maintenance";
