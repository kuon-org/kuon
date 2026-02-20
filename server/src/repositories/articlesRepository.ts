import prisma from "../prisma/client.js";

export const findAllPublishedArticles = async () => {
    return prisma.articles.findMany({
        where: {
            is_published: true,
        },
        orderBy: {
            created_at: "desc",
        },
        select: {
            id: true,
            user_id: true,
            title: true,
            summary: true,
            created_at: true,
            like_count: true,
            is_published: true,
            users: {
                select: {
                    username: true,
                    display_name: true,
                    avatar_url: true,
                },
            },
            // タグ情報を取得
            article_tags: {
                select: {
                    tags: { // article_tags -> tags リレーション
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }
        },
    });
};

export const findAllArticlesByUserId = async (userId: string) => {
    return prisma.articles.findMany({
        where: {
            user_id: userId, // 指定されたユーザID
        },
        orderBy: {
            created_at: "desc", // 新しい順に
        },
        select: {
            id: true,
            user_id: true,
            title: true,
            raw_content: true,
            render_content: true,
            summary: true,
            created_at: true,
            updated_at: true,
            like_count: true,
            is_published: true, // 公開・下書き状態を区別するために
            status: true,
            users: {
                select: {
                    username: true,
                },
            },
            article_tags: {
                select: {
                    tags: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            },
        },
    });
};



export const findArticleById = async (articleId: string) => {
    return prisma.articles.findUnique({
        where: { id: articleId },
        select: {
            id: true,
            title: true,
            raw_content: true,
            render_content: true,
            like_count: true,
            created_at: true,
            user_id: true,
            summary: true,
            is_published: true,
            users: {
                select: {
                    username: true,
                    display_name: true,
                    avatar_url: true,
                },
            },
            article_tags: {
                select: {
                    tags: { // article_tags -> tags リレーション
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }
        },
    });
};

export const isOwned = async (articleId: string, userId: string) => {
    const count = await prisma.articles.count({
        where: {
            id: articleId,
            user_id: userId,
        },
    });
    return count > 0;
};

export const isLiked = async (articleId: string, userId: string) => {
    return prisma.article_likes.findUnique({
        where: {
            article_id_user_id: { article_id: articleId, user_id: userId },
        },
    });
}


export const getArticleLikeUserByArticleId = async (articleId: string) => {
    return prisma.article_likes.findMany({
        where: { article_id: articleId },
        include: { users: true }
    })
}

// いいね追加
export const addLike = async (articleId: string, userId: string) => {
    return prisma.article_likes.create({
        data: {
            article_id: articleId,
            user_id: userId,
        },
    });
};

// いいね削除
export const removeLike = async (articleId: string, userId: string) => {
    return prisma.article_likes.delete({
        where: {
            article_id_user_id: { article_id: articleId, user_id: userId },
        },
    });
};



/**
 * 記事の新規作成
 */
export const createArticles = async (data: {
    user_id: string;
    title: string;
    raw_content?: string;
    render_content?: string;
    last_published_raw_content?: string;
    summary?: string;
    status?: string;
    is_published?: boolean;
}) => {
    return prisma.articles.create({
        data: {
            user_id: data.user_id,
            title: data.title,
            raw_content: data.raw_content,
            render_content: data.render_content,
            last_published_raw_content: data.last_published_raw_content,
            summary: data.summary,
            status: data.status ?? "draft", // デフォルト値を指定する場合
            is_published: data.is_published ?? false,
        },
    });
};

/**
 * 記事の更新
 */
export const updateArticles = async (
    articleId: string,
    data: {
        title?: string;
        raw_content?: string;
        render_content?: string;
        last_published_raw_content: string;
        summary?: string;
        status?: string;
        is_published?: boolean;
    }
) => {
    return prisma.articles.update({
        where: { id: articleId },
        data: {
            ...data,
            updated_at: new Date(), // 更新日時を現在時刻に
        },
    });
};

/**
 * 統計カウントのインクリメント（閲覧数アップなど）
 */
export const incrementViewCount = async (articleId: string) => {
    return prisma.articles.update({
        where: { id: articleId },
        data: {
            view_count: {
                increment: 1,
            },
        },
    });
};

