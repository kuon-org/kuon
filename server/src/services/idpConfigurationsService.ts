import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";

export class IdpConfigurationsService {
  constructor(
    private repo: IdpConfigurationRepository,
    private urepo: UsersRepository,
  ) {}

  async getProviders() {
    const providers = await this.repo.getProviders();
    const activeProviders = providers.map((p) => ({
      provider_name: p.provider_name,
      display_name: p.display_name,
      provider_type: p.provider_type,
      logo_url: p.logo_url,
      button_color: p.idp_configurations!.button_color,
      text_color: p.idp_configurations!.text_color,
    }));
    console.log(activeProviders);
    return activeProviders;
  }

  async getAllProvidersList(userId: string) {
    const isAdmin = await this.urepo.isAdmin(userId);
    if (!isAdmin) throw new Error("権限がありません");

    const providers = await this.repo.getAllProviders();
    return providers.map((p) => ({
      provider_name: p.provider_name,
      display_name: p.display_name,
      is_active: p.idp_configurations?.is_active ?? false,
    }));
  }
  async getProviderConfiguration(userId: string, provider_name: string) {
    const isAdmin = await this.urepo.isAdmin(userId);
    console.log(isAdmin);
    console.log(userId);
    if (!isAdmin) throw new Error("権限がありません");
    return await this.repo.getConfiguration(provider_name);
  }

  async upsertIdp(userId: string, provider_name: string, data: any) {
    const isAdmin = await this.urepo.isAdmin(userId);
    if (!isAdmin) throw new Error("権限がありません");

    const existing = await this.repo.getConfiguration(provider_name);
    const rawConfig = existing?.idp_configurations?.config;
    const existingConfig =
      rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    const baseUrl =
      process.env.APP_SITE_URL ??
      process.env.BACKEND_URL ??
      "http://localhost:3000";
    const generatedRedirectUri = `${baseUrl.replace(/\/$/, "")}/auth/${provider_name}/callback`;
    // 修正: client_id/secret だけでなく、渡された config 全体をマージする
    const mergedConfig = {
      ...existingConfig,
      ...data.config,
    };
    if (!mergedConfig.redirect_uri) {
      mergedConfig.redirect_uri = generatedRedirectUri;
    }

    // upsert用データ
    const combineData = {
      ...existing,
      config: mergedConfig,
      updated_at: new Date(),
      // 必要に応じて display_name などをデフォルトセット
      display_name: existing?.display_name || provider_name,
      provider_type: existing?.provider_type || "OIDC",
    };

    return await this.repo.upsertIdp(provider_name, combineData);
  }
  async toggleActive(userId: string, provider_name: string) {
    const isAdmin = await this.urepo.isAdmin(userId);
    if (!isAdmin) throw new Error("権限がありません");
    return await this.repo.toggleIdpActive(provider_name);
  }

  async deleteIdp(userId: string, provider_name: string) {
    const isAdmin = await this.urepo.isAdmin(userId);
    if (!isAdmin) throw new Error("権限がありません");
    return await this.repo.deleteIdp(provider_name);
  }
}
