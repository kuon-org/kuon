const BASE_URL = process.env.APP_SITE_URL ?? process.env.BACKEND_URL;

export const ROLES = [
  {
    name: "admin",
    display_name: "Admin",
    description: "全権限。ユーザ管理、設定変更、コンテンツ編集・削除など",
  },
  {
    name: "moderator",
    display_name: "Moderator",
    description: "投稿やコメントの管理・削除",
  },
  {
    name: "general",
    display_name: "General",
    description: "自分のコンテンツの作成・編集",
  },
  {
    name: "readonly",
    display_name: "Readonly",
    description: "閲覧専用。編集・削除不可",
  },
];

export const DISCORD_TEMPLATE = {
  provider_name: "discord",
  display_name: "Discord",
  provider_type: "OAUTH2",
  description: "Discord OAuth2",
  logo_url: null,
  button_color: "#5865F2",
  text_color: "#FFFFFF",
  config: {
    auth_method: "body",
    scope: "identify",
    auth_url: "https://discord.com/api/oauth2/authorize",
    token_url: "https://discord.com/api/oauth2/token",
    user_info_url: "https://discord.com/api/users/@me",
    mapping: {
      id: "id",
      username: "username",
      avatar_path: "avatar",
      display_name: "global_name",
      avatar_template: "https://cdn.discordapp.com/avatars/{id}/{avatar}.png",
    },
    redirect_uri: `${BASE_URL}/auth/discord/callback`,
  },
};

export const TWITTER_TEMPLATE = {
  provider_name: "twitter",
  display_name: "Twitter",
  provider_type: "OAUTH2",
  description: "Twitter OAuth2",
  logo_url: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
  button_color: "#1DA1F2",
  text_color: "#FFFFFF",
  config: {
    auth_method: "header",
    scope: "tweet.read users.read offline.access",
    auth_url: "https://twitter.com/i/oauth2/authorize",
    token_url: "https://api.twitter.com/2/oauth2/token",
    user_info_url:
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
    mapping: {
      id: "data.id",
      username: "data.username",
      avatar_path: "data.profile_image_url",
      display_name: "data.name",
      avatar_replace: {
        to: "_400x400",
        from: "_normal",
      },
    },
    redirect_uri: `${BASE_URL}/auth/twitter/callback`,
  },
};

export const GITHUB_TEMPLATE = {
  provider_name: "github",
  display_name: "GitHub",
  provider_type: "OAUTH2",
  description: "GitHub OAuth2",
  logo_url:
    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
  button_color: "#24292F",
  text_color: "#FFFFFF",
  config: {
    auth_method: "body",
    scope: "read:user user:email",
    auth_url: "https://github.com/login/oauth/authorize",
    token_url: "https://github.com/login/oauth/access_token",
    user_info_url: "https://api.github.com/user",
    mapping: {
      id: "id",
      username: "login",
      avatar_path: "avatar_url",
      display_name: "name",
    },
    redirect_uri: `${BASE_URL}/auth/github/callback`,
  },
};
