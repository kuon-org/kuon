import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";

export class IdpConfigurationsService {
  constructor(
    private repo: IdpConfigurationRepository,
    private _urepo: UsersRepository,
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
    return activeProviders;
  }

  async getAllProvidersList(_userId: string) {
    const providers = await this.repo.getAllProviders();
    return providers.map((p) => ({
      provider_name: p.provider_name,
      display_name: p.display_name,
      is_active: p.idp_configurations?.is_active ?? false,
    }));
  }

  async getProviderConfiguration(_userId: string, provider_name: string) {
    return await this.repo.getConfiguration(provider_name);
  }

  async upsertIdp(_userId: string, provider_name: string, data: any) {
    const existing = await this.repo.getConfiguration(provider_name);
    const rawConfig = existing?.idp_configurations?.config;
    const existingConfig =
      rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    const baseUrl =
      process.env.APP_SITE_URL ??
      process.env.BACKEND_URL ??
      "http://localhost:3000";
    const generatedRedirectUri = `${baseUrl.replace(/\/$/, "")}/auth/${provider_name}/callback`;
    const mergedConfig = {
      ...existingConfig,
      ...data.config,
    };
    if (!mergedConfig.redirect_uri) {
      mergedConfig.redirect_uri = generatedRedirectUri;
    }

    const combineData = {
      ...existing,
      config: mergedConfig,
      updated_at: new Date(),
      display_name: existing?.display_name || provider_name,
      provider_type: data.provider_type || existing?.provider_type || "OIDC",
    };

    return await this.repo.upsertIdp(provider_name, combineData);
  }

  async toggleActive(_userId: string, provider_name: string) {
    return await this.repo.toggleIdpActive(provider_name);
  }

  async deleteIdp(_userId: string, provider_name: string) {
    return await this.repo.deleteIdp(provider_name);
  }
}
