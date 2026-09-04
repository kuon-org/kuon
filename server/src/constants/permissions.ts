export const Permissions = {
  Article: {
    Read: "article.read",
    Create: "article.create",
    UpdateOwn: "article.update.own",
    UpdateAny: "article.update.any",
    DeleteOwn: "article.delete.own",
    DeleteAny: "article.delete.any",
  },
  Comment: {
    Create: "comment.create",
    DeleteOwn: "comment.delete.own",
    DeleteAny: "comment.delete.any",
  },
  Tag: {
    Create: "tag.create",
    Manage: "tag.manage",
  },
  User: {
    Read: "user.read",
    Manage: "user.manage",
  },
  Role: {
    Read: "role.read",
    Create: "role.create",
    Update: "role.update",
    Delete: "role.delete",
    Assign: "role.assign",
  },
  System: {
    SettingsManage: "system.settings.manage",
    IdpManage: "system.idp.manage",
    WebhookManage: "system.webhook.manage",
    BackupExecute: "system.backup.execute",
    MaintenanceBypass: "system.maintenance.bypass",
  },
  EventLog: {
    Read: "eventlog.read",
  },
} as const;

export const permissionDefinitions = [
  { key: Permissions.Article.Read, displayName: "記事を閲覧", category: "article", description: "公開範囲内の記事を閲覧できます", requires: [] },
  { key: Permissions.Article.Create, displayName: "記事を作成", category: "article", description: "記事を新規作成できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Article.UpdateOwn, displayName: "自分の記事を編集", category: "article", description: "自分が作成した記事を編集できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Article.UpdateAny, displayName: "すべての記事を編集", category: "article", description: "所有者に関係なく記事を編集できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Article.DeleteOwn, displayName: "自分の記事を削除", category: "article", description: "自分が作成した記事を削除できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Article.DeleteAny, displayName: "すべての記事を削除", category: "article", description: "所有者に関係なく記事を削除できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Comment.Create, displayName: "コメントを作成", category: "comment", description: "コメントを投稿できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Comment.DeleteOwn, displayName: "自分のコメントを削除", category: "comment", description: "自分のコメントを削除できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Comment.DeleteAny, displayName: "すべてのコメントを削除", category: "comment", description: "所有者に関係なくコメントを削除できます", requires: [Permissions.Article.Read] },
  { key: Permissions.Tag.Create, displayName: "タグを作成", category: "tag", description: "新しいタグを作成できます", requires: [] },
  { key: Permissions.Tag.Manage, displayName: "タグを管理", category: "tag", description: "タグ情報とタグ画像を編集できます", requires: [Permissions.Tag.Create] },
  { key: Permissions.User.Read, displayName: "ユーザー一覧を閲覧", category: "user", description: "管理画面からユーザー情報を確認できます", requires: [] },
  { key: Permissions.User.Manage, displayName: "ユーザーを管理", category: "user", description: "ユーザーの有効・無効などを管理できます", requires: [Permissions.User.Read] },
  { key: Permissions.Role.Read, displayName: "ロールを閲覧", category: "role", description: "ロールとPermissionの設定を確認できます", requires: [] },
  { key: Permissions.Role.Create, displayName: "ロールを作成", category: "role", description: "カスタムロールを作成できます", requires: [Permissions.Role.Read] },
  { key: Permissions.Role.Update, displayName: "ロールを編集", category: "role", description: "ロールのPermission構成を編集できます", requires: [Permissions.Role.Read] },
  { key: Permissions.Role.Delete, displayName: "ロールを削除", category: "role", description: "カスタムロールを削除できます", requires: [Permissions.Role.Read] },
  { key: Permissions.Role.Assign, displayName: "ロールを割り当て", category: "role", description: "ユーザーへロールを割り当てられます", requires: [Permissions.Role.Read] },
  { key: Permissions.System.SettingsManage, displayName: "システム設定を管理", category: "system", description: "Kuonのシステム設定を変更できます", requires: [] },
  { key: Permissions.System.IdpManage, displayName: "IdP設定を管理", category: "system", description: "外部IdP設定を変更できます", requires: [] },
  { key: Permissions.System.WebhookManage, displayName: "Webhookを管理", category: "system", description: "Webhook設定を変更できます", requires: [] },
  { key: Permissions.System.BackupExecute, displayName: "Backup / Restoreを実行", category: "system", description: "バックアップの作成とリストアを実行できます", requires: [] },
  { key: Permissions.System.MaintenanceBypass, displayName: "メンテナンスモードを回避", category: "system", description: "メンテナンスモード中も管理操作のため画面へアクセスできます", requires: [] },
  { key: Permissions.EventLog.Read, displayName: "イベントログを閲覧", category: "system", description: "サーバイベントログを閲覧できます", requires: [] },
] as const;

export type PermissionKey = (typeof permissionDefinitions)[number]["key"];

export const permissionKeys = new Set<PermissionKey>(
  permissionDefinitions.map((permission) => permission.key),
);

export const adminAccessPermissions: readonly PermissionKey[] = [
  Permissions.User.Read,
  Permissions.User.Manage,
  Permissions.Role.Read,
  Permissions.Role.Create,
  Permissions.Role.Update,
  Permissions.Role.Delete,
  Permissions.Role.Assign,
  Permissions.System.SettingsManage,
  Permissions.System.IdpManage,
  Permissions.System.WebhookManage,
  Permissions.System.BackupExecute,
  Permissions.System.MaintenanceBypass,
  Permissions.EventLog.Read,
];

export const normalizePermissionDependencies = (
  requested: readonly PermissionKey[],
): PermissionKey[] => {
  const result = new Set<PermissionKey>();
  const byKey = new Map(permissionDefinitions.map((item) => [item.key, item]));

  const add = (key: PermissionKey) => {
    if (result.has(key)) return;
    result.add(key);
    const definition = byKey.get(key);
    definition?.requires.forEach((dependency) => add(dependency));
  };

  requested.forEach(add);
  return [...result];
};
