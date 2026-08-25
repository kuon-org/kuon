import { ArticlesRepository } from "../repositories/articlesRepository.js";
import { ArticlesService } from "./articlesService.js";
import { WebhookDispatcherService } from "./webhookDispatcherService.js";
import { WebhookEventType } from "../webhooks/events.js";

export class WebhookAwareArticlesService extends ArticlesService {
  constructor(
    articlesRepo: ArticlesRepository,
    private webhookDispatcher: WebhookDispatcherService,
  ) {
    super(articlesRepo);
  }

  override async createArticle(userId: string, payload: any) {
    const article = await super.createArticle(userId, payload);

    const shouldNotify =
      payload.status === "public" &&
      payload.is_published === true &&
      payload.is_private !== true;

    if (!shouldNotify) {
      return article;
    }

    try {
      const detail = await super.getArticle(article.id, userId);
      const baseUrl = (process.env.APP_SITE_URL ?? process.env.BACKEND_URL ?? "")
        .replace(/\/$/, "");
      const articleUrl = baseUrl
        ? `${baseUrl}/share/${article.id}`
        : `/share/${article.id}`;

      void this.webhookDispatcher
        .dispatchArticlePublished(
          {
            event: {
              type: WebhookEventType.ArticlePublished,
              createdAt: new Date().toISOString(),
            },
            article: {
              id: detail.id,
              title: detail.title ?? "",
              summary: detail.summary ?? null,
              url: articleUrl,
            },
            author: {
              username: detail.users?.username ?? null,
              displayName: detail.users?.display_name ?? null,
              avatarUrl: detail.users?.avatar_url ?? null,
            },
          },
          userId,
        )
        .catch((error) => {
          console.error("Failed to dispatch article.published webhook", error);
        });
    } catch (error) {
      // Webhook準備の失敗で記事投稿そのものを失敗させない。
      console.error("Failed to prepare article.published webhook", error);
    }

    return article;
  }
}
