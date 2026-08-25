import { ServerSettingKey } from "../constants/serverSettings.js";
import { WebhookRepository } from "../repositories/webhookRepository.js";
import { serverSettingsService } from "./serverSettingsService.js";
import { WebhookService } from "./webhookService.js";
import { WebhookScope } from "../webhooks/events.js";
import type { CreateWebhookInput, UpdateWebhookInput } from "../webhooks/types.js";

export class UserWebhookService {
  private baseService: WebhookService;

  constructor(private repo: WebhookRepository) {
    this.baseService = new WebhookService(repo);
  }

  isAvailable(): boolean {
    return (
      serverSettingsService.isEnabled(ServerSettingKey.WebhooksEnabled) &&
      serverSettingsService.isEnabled(ServerSettingKey.AllowUserWebhooks)
    );
  }

  ensureAvailable(): void {
    if (!this.isAvailable()) {
      throw new Error("ユーザーWebhookは現在利用できません");
    }
  }

  getMetadataEvents() {
    this.ensureAvailable();
  }

  async getAll(userId: string) {
    return this.repo.findAllByOwner(userId);
  }

  async getById(id: string, userId: string) {
    return this.repo.findDetailByOwner(id, userId);
  }

  async create(userId: string, input: Omit<CreateWebhookInput, "scope" | "ownerUserId">) {
    this.ensureAvailable();
    const enforced: CreateWebhookInput = {
      ...input,
      scope: WebhookScope.User,
      ownerUserId: userId,
    };
    this.baseService.validateCreateInput(enforced);
    return this.repo.create(enforced);
  }

  async update(
    id: string,
    userId: string,
    input: Omit<UpdateWebhookInput, "scope" | "ownerUserId">,
  ) {
    this.ensureAvailable();
    const enforced: UpdateWebhookInput = {
      ...input,
      scope: WebhookScope.User,
      ownerUserId: userId,
    };
    this.baseService.validateCreateInput(enforced);
    return this.repo.updateByOwner(id, userId, enforced);
  }

  async setActive(id: string, userId: string, isActive: boolean) {
    this.ensureAvailable();
    return this.repo.setActiveByOwner(id, userId, isActive);
  }

  async getDeliveries(id: string, userId: string, limit?: number) {
    return this.repo.findDeliveriesByOwner(id, userId, limit);
  }

  async delete(id: string, userId: string) {
    this.ensureAvailable();
    return this.repo.deleteByOwner(id, userId);
  }
}

export const userWebhookService = new UserWebhookService(new WebhookRepository());
