import * as articlesRepo from '../repositories/articlesRepository.js';

export const getPublishedArticleList = async () => {
  return await articlesRepo.findAllPublishedArticles();
}

export const getArticle = async (articleId: string) => {
  const article = await articlesRepo.findArticleById(articleId);
  if (!article) throw new Error("ArticleNotFound");
  return article;
};

export const getAllArticlesByUserId = async (userId: string) => {
  return await articlesRepo.findAllArticlesByUserId(userId);
}

export const getPublishedArticlesByUserId = async (userId: string) => {
  const allArticles = await articlesRepo.findAllArticlesByUserId(userId);
  // サービス層で公開記事だけを抽出
  return allArticles.filter(article => article.is_published === true);
};

export const getDraftArticlesByUserId = async (userId: string) => {
  const allArticles = await articlesRepo.findAllArticlesByUserId(userId);
  // 下書き状態のみ抽出
  return allArticles.filter(article => article.is_published === false);
};

export const getArticleLikeUserWithCount = async (articleId: string) => {
  const likeRecords = await articlesRepo.getArticleLikeUserByArticleId(articleId);
  const likeUsers = likeRecords.map((record) => {
    const user = record.users;
    return {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by,
    };
  });
  return {
    like_users: likeUsers,
    like_count: likeUsers.length,
  };
}

export const getIsOwned = async (articleId: string, userId: string) => {
  return await articlesRepo.isOwned(articleId, userId);
}

export const getIsLiked = async (articleId: string, userId: string) => {
  const is_like = await articlesRepo.isLiked(articleId, userId);
  if (!is_like) return false;
  return true;
}

export const toggleLike = async (articleId: string, userId: string) => {
  const existing = await articlesRepo.isLiked(articleId, userId);
  if (existing) {
    await articlesRepo.removeLike(articleId, userId);
    return { isLike: false, message: 'いいねを解除しました' };
  } else {
    await articlesRepo.addLike(articleId, userId);
    return { isLike: true, message: 'いいねしました' };
  }
};


/**
 * 記事を新規作成する
 */
export const createArticle = async (userId: string, payload: {
  title: string;
  content: string;
  summary?: string;
  isPublished?: boolean;
}) => {
  // 例: タイトルのバリデーション（空文字チェックなど）
  if (!payload.title) throw new Error("TitleRequired");

  // MarkdownからHTMLへの変換処理などをここで行う（render_contentの生成）
  // const rendered = transformMarkdownToHtml(payload.content);

  return articlesRepo.createArticles({
    user_id: userId,
    title: payload.title,
    raw_content: payload.content,
    render_content: payload.content, // 今後変更の予定あり
    last_published_raw_content: payload.isPublished
      ? payload.content
      : undefined,
    summary: payload.summary || payload.content.substring(0, 100), // 要約がなければ先頭100文字
    status: payload.isPublished ? "public" : "draft",
    is_published: payload.isPublished ?? false,
  });
};

/**
 * 記事を更新する
 */
export const updateArticle = async (articleId: string, userId: string, payload: {
  title?: string;
  content?: string;
  isPublished?: boolean;
}) => {
  // 1. 記事の存在確認と権限チェック
  const existing = await articlesRepo.findArticleById(articleId);
  if (!existing) throw new Error("ArticleNotFound");

  // 作成者本人かどうかのチェック（重要！）
  // ※リポジトリ層のfindArticleByIdでuser_idも取得するようにしておく必要があります
  if (existing.user_id !== userId) throw new Error("Forbidden");

  const updateData: any = { ...payload };

  if (payload.content) {
    updateData.raw_content = payload.content;
    if (payload.isPublished) {
      // 公開時に render_content と last_published_raw_content を更新
      updateData.render_content = payload.content;
      updateData.last_published_raw_content = payload.content;
    }
  }
  // Prisma にないフィールドは削除
  delete updateData.content;

  if (payload.isPublished !== undefined) {
    updateData.status = payload.isPublished ? "public" : "draft";
    updateData.is_published = payload.isPublished;
  }

  delete updateData.isPublished;

  return articlesRepo.updateArticles(articleId, updateData);
};

// SPAのため必要なし。
// 補助的な関数（ライブラリなどを使用）
// const transformMarkdownToHtml = (markdown: string) => {
//     // ここで markdown-it や marked などを使って変換
//     return `<div>${markdown}</div>`;
// };