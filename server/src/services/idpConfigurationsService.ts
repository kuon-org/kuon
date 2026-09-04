import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import {
  getPublicRuntimeIdp,
  getRuntimeIdp,
  getRuntimeIdps,
} from "./runtimeIdpService.js";

export class IdpConfigurationsService {
  constructor(
    private repo: IdpConfigurationRepository,
    private _urepo: UsersRepository,
  ) {}

  async getProviders() {
    const providers = await getRuntimeIdps();
    return providers
      .filter((provider) => provider.idp_configurations.is_active)
      .map((provider) => ({
        provider_name: provider.provider_name,
        display_name: provider.display_name,
        provider_type: provider.provider_type,
        logo_url: provider.logo_url,
        button_color: provider.idp_configurations.button_color,
        text_color: provider.idp_configurations.text_color,
      }));
  }

  async getAllProvidersList(_userId: string) {
    const providers = await getRuntimeIdps();
    return providers.map((provider) => ({
      provider_name: provider.provider_name,
      display_name: provider.display_name,
      is_active: provider.idp_configurations.is_active,
      source: provider.source,
      readOnly: provider.readOnly,
    }));
  }

  async getProviderConfiguration(_userId: string, provider_name: string) {
    const provider = await getRuntimeIdp(provider_name);
    return provider ? getPublicRuntimeIdp(provider) : null;
  }

  async upsertIdp(_userId: string, provider_name: string, data: any) {
    const runtimeProvider = await getRuntimeIdp(provider_name);
    if (runtimeProvider?.source === "environment") {
      throw new Error("環境変数から設定されているIdPは管理画面から変更できません");
    }

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
    const runtimeProvider = await getRuntimeIdp(provider_name);
    if (runtimeProvider?.source === "environment") {
      throw new Error("環境変数から設定されているIdPは管理画面から変更できません");
    }
    return await this.repo.toggleIdpActive(provider_name);
  }

  async deleteIdp(_userId: string, provider_name: string) {
    const runtimeProvider = await getRuntimeIdp(provider_name);
    if (runtimeProvider?.source === "environment") {
      throw new Error("環境変数から設定されているIdPは管理画面から削除できません");
    }
    return await this.repo.deleteIdp(provider_name);
  }
}
