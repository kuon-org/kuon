export const ROLES = [
    {
      name: 'admin',
      display_name: 'Admin',
      description: '全権限。ユーザ管理、設定変更、コンテンツ編集・削除など'
    },
    {
      name: 'moderator',
      display_name: 'Moderator',
      description: '投稿やコメントの管理・削除'
    },
    {
      name: 'general',
      display_name: 'General',
      description: '自分のコンテンツの作成・編集'
    },
    {
      name: 'readonly',
      display_name: 'Readonly',
      description: '閲覧専用。編集・削除不可'
    },
  ];