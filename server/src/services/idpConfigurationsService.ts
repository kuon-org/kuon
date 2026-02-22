
import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository";
import { UsersRepository } from "../repositories/usersRepository";

export class IdpConfigurationsService {

    constructor(
        private repo: IdpConfigurationRepository,
        private urepo: UsersRepository

    ) { }

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
        console.log(activeProviders)
        return activeProviders;
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

        const mergedConfig = {
            ...existingConfig,
            client_id: data.client_id,
            client_secret: data.client_secret,
        };

        // upsert用データ
        const combineData = {
            ...existing,
            config: mergedConfig,
            updated_at: new Date(),
        };

        return await this.repo.upsertIdp(provider_name, combineData);
    }

    async toggleActive(userId: string, provider_name: string) {
        const isAdmin = await this.urepo.isAdmin(userId);
        if (!isAdmin) throw new Error("権限がありません");
        return await this.repo.toggleIdpActive(provider_name);
    }
}