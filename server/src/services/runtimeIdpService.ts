import prisma from "../prisma/client.js";
import {
  getEnvironmentIdp,
  getEnvironmentIdps,
  sanitizeIdpConfig,
} from "../config/idpEnvironmentConfiguration.js";

export type RuntimeIdpSource = "environment" | "database";

export type RuntimeIdp = {
  id: string;
  provider_name: string;
  display_name: string;
  provider_type: string;
  description: string | null;
  logo_url: string | null;
  source: RuntimeIdpSource;
  readOnly: boolean;
  idp_configurations: {
    config: Record<string, unknown>;
    button_color: string | null;
    text_color: string | null;
    is_active: boolean;
  };
};

const ensureEnvironmentProviderIdentity = async (
  providerName: string,
  displayName: string,
  providerType: string,
) =>
  prisma.identity_providers.upsert({
    where: { provider_name: providerName },
    update: {},
    create: {
      provider_name: providerName,
      display_name: displayName,
      provider_type: providerType,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

export const getRuntimeIdp = async (
  providerName: string,
): Promise<RuntimeIdp | null> => {
  const environment = getEnvironmentIdp(providerName);
  if (environment) {
    const identity = await ensureEnvironmentProviderIdentity(
      environment.provider_name,
      environment.display_name,
      environment.provider_type,
    );
    return {
      id: identity.id,
      provider_name: environment.provider_name,
      display_name: environment.display_name,
      provider_type: environment.provider_type,
      description: environment.description ?? null,
      logo_url: environment.logo_url ?? null,
      source: "environment",
      readOnly: true,
      idp_configurations: {
        config: environment.config,
        button_color: environment.button_color ?? null,
        text_color: environment.text_color ?? null,
        is_active: environment.is_active,
      },
    };
  }

  const database = await prisma.identity_providers.findUnique({
    where: { provider_name: providerName },
    include: { idp_configurations: true },
  });
  if (!database?.idp_configurations) return null;

  return {
    id: database.id,
    provider_name: database.provider_name,
    display_name: database.display_name,
    provider_type: database.provider_type,
    description: database.description,
    logo_url: database.logo_url,
    source: "database",
    readOnly: false,
    idp_configurations: {
      config:
        database.idp_configurations.config &&
        typeof database.idp_configurations.config === "object"
          ? (database.idp_configurations.config as Record<string, unknown>)
          : {},
      button_color: database.idp_configurations.button_color,
      text_color: database.idp_configurations.text_color,
      is_active: database.idp_configurations.is_active ?? false,
    },
  };
};

export const getRuntimeIdps = async (): Promise<RuntimeIdp[]> => {
  const databaseProviders = await prisma.identity_providers.findMany({
    include: { idp_configurations: true },
    orderBy: { created_at: "asc" },
  });
  const environmentProviders = getEnvironmentIdps();
  const environmentNames = new Set(
    environmentProviders.map((provider) => provider.provider_name),
  );

  const result: RuntimeIdp[] = databaseProviders
    .filter(
      (provider) =>
        !environmentNames.has(provider.provider_name) &&
        provider.idp_configurations !== null,
    )
    .map((provider) => ({
      id: provider.id,
      provider_name: provider.provider_name,
      display_name: provider.display_name,
      provider_type: provider.provider_type,
      description: provider.description,
      logo_url: provider.logo_url,
      source: "database" as const,
      readOnly: false,
      idp_configurations: {
        config:
          provider.idp_configurations!.config &&
          typeof provider.idp_configurations!.config === "object"
            ? (provider.idp_configurations!.config as Record<string, unknown>)
            : {},
        button_color: provider.idp_configurations!.button_color,
        text_color: provider.idp_configurations!.text_color,
        is_active: provider.idp_configurations!.is_active ?? false,
      },
    }));

  for (const provider of environmentProviders) {
    const resolved = await getRuntimeIdp(provider.provider_name);
    if (resolved) result.push(resolved);
  }

  return result;
};

export const getPublicRuntimeIdp = (provider: RuntimeIdp) => ({
  ...provider,
  idp_configurations: {
    ...provider.idp_configurations,
    config: sanitizeIdpConfig(provider.idp_configurations.config),
  },
});
