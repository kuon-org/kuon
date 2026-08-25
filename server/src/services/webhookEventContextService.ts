import prisma from "../prisma/client.js";
import { WebhookEventType } from "../webhooks/events.js";
import { toWebhookExternalUrl } from "../webhooks/url.js";

const articleUrl = (articleId: string) => toWebhookExternalUrl(`/share/${articleId}`) ?? `/share/${articleId}`;

const actor = (user: { username: string | null; display_name: string | null; avatar_url: string | null }) => ({
  username: user.username,
  displayName: user.display_name,
  avatarUrl: toWebhookExternalUrl(user.avatar_url),
});

export class WebhookEventContextService {
  async articleUpdated(articleId: string) {
    const article = await prisma.articles.findUnique({
      where: { id: articleId },
      include: { users: true },
    });
    if (!article?.users) throw new Error("Article or author not found");
    return {
      recipientUserId: article.user_id,
      context: {
        event: { type: WebhookEventType.ArticleUpdated, createdAt: new Date().toISOString() },
        article: {
          id: article.id,
          title: article.title ?? "",
          summary: article.summary ?? null,
          url: articleUrl(article.id),
        },
        actor: actor(article.users),
      },
    } as const;
  }

  async commentCreated(commentId: string) {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      include: {
        users: true,
        articles: true,
      },
    });
    if (!comment?.users || !comment.articles) throw new Error("Comment context not found");
    return {
      recipientUserId: comment.articles.user_id,
      context: {
        event: { type: WebhookEventType.CommentCreated, createdAt: new Date().toISOString() },
        article: {
          id: comment.articles.id,
          title: comment.articles.title ?? "",
          url: articleUrl(comment.articles.id),
        },
        comment: {
          id: comment.id,
          body: comment.body ?? "",
        },
        actor: actor(comment.users),
      },
    } as const;
  }

  async articleLiked(articleId: string, actorUserId: string) {
    const [article, liker] = await Promise.all([
      prisma.articles.findUnique({ where: { id: articleId } }),
      prisma.users.findUnique({ where: { id: actorUserId } }),
    ]);
    if (!article || !liker) throw new Error("Article like context not found");
    return {
      recipientUserId: article.user_id,
      context: {
        event: { type: WebhookEventType.ArticleLiked, createdAt: new Date().toISOString() },
        article: {
          id: article.id,
          title: article.title ?? "",
          url: articleUrl(article.id),
        },
        actor: actor(liker),
      },
    } as const;
  }
}

export const webhookEventContextService = new WebhookEventContextService();
