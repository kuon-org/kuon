import { ArticlesRepository } from "../repositories/articlesRepository.js";
import generateSummary from "../utils/generateSummary/index.js";
import { asUUID } from "../utils/uuid/index.js";
import { Marp } from "@marp-team/marp-core";
import { webhookDispatcherService } from "./webhookDispatcherService.js";
import { webhookEventContextService } from "./webhookEventContextService.js";
import { WebhookEventType } from "../webhooks/events.js";
import { buildWebhookArticleUrl, toWebhookExternalUrl } from "../webhooks/url.js";
import { notificationService } from "./notificationService.js";
import prisma from "../prisma/client.js";

export class ArticlesService {
  constructor(private articlesRepo: ArticlesRepository) {}

  async getPublishedArticleList(page: number, limit: number, q?: string) {
    return await this.articlesRepo.findAllPublishedArticles(page, limit, q);
  }
  async getTrendingArticleList(page: number, limit: number, weights?: any) {
    const safeWeights = {
      like: Number(weights?.like ?? 10),
      view: Number(weights?.view ?? 1),
      stock: Number(weights?.stock ?? 20),
      comment: Number(weights?.comment ?? 15),
    };

    return await this.articlesRepo.findTrendingArticles(
      safeWeights,
      page,
      limit,
    );
  }

  async getRecommendArticleList(
    userId: string | null,
    page: number,
    limit: number,
  ) {
    return await this.articlesRepo.findRecommendedArticles(userId, page, limit);
  }
  async getArticle(articleId: string, currentUserId?: string) {
    if (!asUUID(articleId)) throw new Error("invalid articleId");
    const article = await this.articlesRepo.findArticleById(articleId);
    if (!article || article.is_deleted) throw new Error("ArticleNotFound");

    if (currentUserId && article.user_id === currentUserId) {
      return article;
    }

    if (article.visibility === "members") {
      if (!currentUserId || !article.group_id) throw new Error("Forbidden");
      const membership = await prisma.user_groups.findUnique({
        where: { user_id_group_id: { user_id: currentUserId, group_id: article.group_id } },
        select: { user_id: true },
      });
      if (!membership) throw new Error("Forbidden");
    } else if (article.visibility === "private" || article.is_private) {
      throw new Error("Forbidden");
    }

    return article;
  }

  async getAllArticlesByUserId(userId: string) {
    return await this.articlesRepo.findAllArticlesByUserId(userId);
  }

  async getArticlesByUserId(
    userId: string,
    page: number,
    limit: number,
    q?: string,
  ) {
    return await this.articlesRepo.findArticlesByUserId(userId, page, limit, q);
  }
  async getArticleLikeUserWithCount(articleId: string, currentUserId?: string) {
    await this.getArticle(articleId, currentUserId);
    const likeRecords =
      await this.articlesRepo.getArticleLikeUserByArticleId(articleId);
    const likeUsers = likeRecords.map((record: any) => record.users);
    return {
      like_users: likeUsers,
      like_count: likeUsers.length,
    };
  }

  async getIsOwned(articleId: string, userId: string) {
    return await this.articlesRepo.isOwned(articleId, userId);
  }

  async getIsLiked(articleId: string, userId: string) {
    await this.getArticle(articleId, userId);
    const isLike = await this.articlesRepo.isLiked(articleId, userId);
    return !!isLike;
  }

  async toggleLike(articleId: string, userId: string) {
    await this.getArticle(articleId, userId);
    const existing = await this.articlesRepo.isLiked(articleId, userId);
    if (existing) {
      await this.articlesRepo.removeLike(articleId, userId);
      return { isLike: false, message: "いいねを解除しました" };
    }

    await this.articlesRepo.addLike(articleId, userId);
    void this.dispatchArticleLiked(articleId, userId);
    return { isLike: true, message: "いいねしました" };
  }

  async createArticle(userId: string, payload: any) {
    const {
      tagIds,
      raw_content,
      status,
      is_published,
      is_private,
      summary,
      notify_webhooks = false,
      webhook_ids = [],
      group_id = null,
      visibility,
    } = payload;
    await this.validateGroupMembership(userId, group_id);
    const resolvedVisibility = this.resolveVisibility(visibility, is_published, is_private);
    this.validateVisibility(resolvedVisibility, group_id);
    const isPublicMode = status === "public";

    const article = await this.articlesRepo.createArticles(
      {
        user_id: userId,
        group_id,
        title: payload.title,
        raw_content,
        render_content: isPublicMode ? raw_content : "",
        last_published_raw_content: isPublicMode ? raw_content : undefined,
        summary: summary || generateSummary(raw_content),
        status: isPublicMode ? "public" : "draft",
        is_published: is_published ?? false,
        is_private: is_private ?? false,
        visibility: resolvedVisibility,
      },
      tagIds,
    );

    const selectedWebhookIds = Array.isArray(webhook_ids)
      ? webhook_ids.filter((id): id is string => typeof id === "string")
      : [];

    if (
      notify_webhooks === true &&
      selectedWebhookIds.length > 0 &&
      isPublicMode &&
      is_published === true &&
      resolvedVisibility === "public"
    ) {
      void this.dispatchArticlePublished(article.id, userId, selectedWebhookIds);
    }

    if (isPublicMode && is_published === true && resolvedVisibility === "public") {
      void notificationService.articlePublished(article.id, userId);
    }

    return article;
  }

  private async dispatchArticlePublished(
    articleId: string,
    userId: string,
    selectedWebhookIds: string[],
  ) {
    try {
      const detail = await this.getArticle(articleId, userId);

      await webhookDispatcherService.dispatchArticlePublished(
        {
          event: {
            type: WebhookEventType.ArticlePublished,
            createdAt: new Date().toISOString(),
          },
          article: {
            id: detail.id,
            title: detail.title ?? "",
            summary: detail.summary ?? null,
            url: buildWebhookArticleUrl(articleId),
          },
          author: {
            username: detail.users?.username ?? null,
            displayName: detail.users?.display_name ?? null,
            avatarUrl: toWebhookExternalUrl(detail.users?.avatar_url),
          },
        },
        userId,
        selectedWebhookIds,
      );
    } catch (error) {
      console.error("Failed to dispatch article.published webhook", error);
    }
  }

  async updateArticle(
    articleId: string,
    userId: string,
    payload: any,
    allowAny = false,
  ) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing) throw new Error("ArticleNotFound");
    if (!allowAny && existing.user_id !== userId) throw new Error("Forbidden");

    const existingPublicationState = await prisma.articles.findUnique({
      where: { id: articleId },
      select: { status: true },
    });

    const {
      tagIds,
      raw_content,
      status,
      is_published,
      is_private,
      notify_webhooks: _notifyWebhooks,
      webhook_ids: _webhookIds,
      group_id,
      visibility,
      ...otherData
    } = payload;

    const updateData: any = { ...otherData, updated_at: new Date() };
    const nextGroupId = Object.prototype.hasOwnProperty.call(payload, "group_id") ? (group_id ?? null) : existing.group_id;
    const resolvedVisibility = this.resolveVisibility(visibility, is_published, is_private, existing.visibility);
    this.validateVisibility(resolvedVisibility, nextGroupId);
    updateData.visibility = resolvedVisibility;

    if (Object.prototype.hasOwnProperty.call(payload, "group_id")) {
      await this.validateGroupMembership(existing.user_id ?? userId, group_id);
      updateData.group_id = group_id ?? null;
    }

    if (status === "public") {
      updateData.raw_content = raw_content;
      updateData.render_content = raw_content;
      updateData.last_published_raw_content = raw_content;
      updateData.status = "public";
      updateData.is_published = is_published;
      updateData.is_private = is_private;
    } else if (status === "draft") {
      updateData.raw_content = raw_content;
      updateData.status = "draft";
      updateData.is_published = existing.is_published;
      updateData.is_private = existing.is_private;
    }

    const updated = await this.articlesRepo.updateArticles(articleId, updateData, tagIds);

    if (
      status === "public" &&
      is_published === true &&
      resolvedVisibility === "public"
    ) {
      void this.dispatchArticleUpdated(articleId);

      const wasPublic =
        existingPublicationState?.status === "public" &&
        existing.is_published === true &&
        existing.visibility === "public";
      if (!wasPublic) {
        void notificationService.articlePublished(articleId, userId);
      }
    }

    return updated;
  }

  private resolveVisibility(value: unknown, isPublished?: boolean, isPrivate?: boolean, fallback?: string) {
    if (["public", "unlisted", "private", "members"].includes(String(value))) return String(value);
    if (isPrivate === true) return "private";
    if (isPublished === true) return "public";
    return fallback ?? "unlisted";
  }

  private validateVisibility(visibility: string, groupId: unknown) {
    if (visibility === "members" && (typeof groupId !== "string" || !asUUID(groupId))) {
      throw new Error("GroupRequiredForMembersVisibility");
    }
  }

  private async validateGroupMembership(userId: string, groupId: unknown) {
    if (groupId === null || groupId === undefined || groupId === "") return;
    if (typeof groupId !== "string" || !asUUID(groupId)) throw new Error("InvalidGroupId");
    const membership = await prisma.user_groups.findUnique({
      where: { user_id_group_id: { user_id: userId, group_id: groupId } },
      select: { user_id: true },
    });
    if (!membership) throw new Error("GroupMembershipRequired");
  }

  private async dispatchArticleUpdated(articleId: string) {
    try {
      const { context, recipientUserId } =
        await webhookEventContextService.articleUpdated(articleId);
      await webhookDispatcherService.dispatch(WebhookEventType.ArticleUpdated, context, {
        recipientUserId,
      });
    } catch (error) {
      console.error("Failed to dispatch article.updated webhook", error);
    }
  }

  private async dispatchArticleLiked(articleId: string, userId: string) {
    try {
      const { context, recipientUserId } =
        await webhookEventContextService.articleLiked(articleId, userId);
      if (!recipientUserId || recipientUserId === userId) return;
      await webhookDispatcherService.dispatch(WebhookEventType.ArticleLiked, context, {
        recipientUserId,
      });
    } catch (error) {
      console.error("Failed to dispatch article.liked webhook", error);
    }
  }

  async rollbackDraft(articleId: string, userId: string, allowAny = false) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || (!allowAny && existing.user_id !== userId))
      throw new Error("Unauthorized or Not Found");
    if (!existing.last_published_raw_content)
      throw new Error("No published version to rollback to");

    const rollbackData = {
      raw_content: existing.last_published_raw_content,
      status: "public",
    };

    return this.articlesRepo.updateArticles(articleId, rollbackData);
  }

  async deleteArticle(articleId: string, userId: string, allowAny = false) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || (!allowAny && existing.user_id !== userId)) {
      throw new Error("Unauthorized or Not Found");
    }
    return await this.articlesRepo.softDeleteArticle(articleId);
  }

  async getTrashArticles(userId: string) {
    return await this.articlesRepo.findDeletedArticlesByUserId(userId);
  }

  async restoreArticle(articleId: string, userId: string, allowAny = false) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || (!allowAny && existing.user_id !== userId))
      throw new Error("Unauthorized");
    return await this.articlesRepo.restoreArticle(articleId);
  }

  async hardDeleteArticle(articleId: string, userId: string, allowAny = false) {
    const existing = await this.articlesRepo.findArticleById(articleId);
    if (!existing || (!allowAny && existing.user_id !== userId))
      throw new Error("Unauthorized");
    return await this.articlesRepo.hardDeleteArticle(articleId);
  }

  async getArticleMarp(articleId: string, currentUserId?: string) {
    const article = await this.getArticle(articleId, currentUserId);
    const marp = new Marp({
      html: true,
      container: { tag: "div", id: "marp-container" },
    });
    if (!article || !article.render_content) throw new Error("ArticleNotFound");
    const { html, css } = marp.render(article.render_content);

    return { html, css, title: article.title };
  }
}
