import { SAML } from "@node-saml/node-saml";
import { IdpConfigurationRepository } from "../repositories/idpConfigurationsRepository.js";
import { UsersRepository } from "../repositories/usersRepository.js";
import { getEnvironmentIdp } from "../config/idpEnvironmentConfiguration.js";
import { resolveIdpConfigSecrets } from "../utils/idpConfigSecrets.js";
import {
  getPublicRuntimeIdp,
  getRuntimeIdp,
  getRuntimeIdps,
} from "./runtimeIdpService.js";

const stripRedactedValues = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripRedactedValues);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== "[REDACTED]")
      .map(([key, item]) => [key, stripRedactedValues(item)]),
  );
};

type ConnectivityCheck = {
  name: string;
  success: boolean;
  status?: number;
  message?: string;
};

const fetchEndpoint = async (
  name: string,
  url: unknown,
): Promise<ConnectivityCheck> => {
  if (typeof url !== "string" || !url.trim()) {
    return { name, success: false, message: "URLが設定されていません" };
  }

  try {
    new URL(url);
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    return { name, success: true, status: response.status };
  } catch {
    return { name, success: false, message: "接続できませんでした" };
  }
};

const formatCertificate = (cert: unknown): string => {
  if (typeof cert !== "string" || !cert) return "";

  const cleanCert = cert
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");

  return `-----BEGIN CERTIFICATE-----\n${cleanCert.match(/.{1,64}/g)?.join("\n") ?? cleanCert}\n-----END CERTIFICATE-----`;
};

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
    const [runtimeProviders, registryProviders] = await Promise.all([
      getRuntimeIdps(),
      this.repo.getAllProviders(),
    ]);
    const configuredNames = new Set(
      runtimeProviders.map((provider) => provider.provider_name),
    );

    const configured = runtimeProviders.map((provider) => ({
      provider_name: provider.provider_name,
      display_name: provider.display_name,
      provider_type: provider.provider_type,
      is_active: provider.idp_configurations.is_active,
      source: provider.source,
      readOnly: provider.readOnly,
      configured: true,
      orphaned: false,
      userIdentityCount:
        registryProviders.find(
          (registry) => registry.provider_name === provider.provider_name,
        )?._count.user_identities ?? 0,
      canCleanup: false,
    }));

    const orphans = registryProviders
      .filter(
        (provider) =>
          !configuredNames.has(provider.provider_name) &&
          provider.idp_configurations === null,
      )
      .map((provider) => ({
        provider_name: provider.provider_name,
        display_name: provider.display_name,
        provider_type: provider.provider_type,
        is_active: false,
        source: "registry" as const,
        readOnly: true,
        configured: false,
        orphaned: true,
        userIdentityCount: provider._count.user_identities,
        canCleanup: provider._count.user_identities === 0,
      }));

    return [...configured, ...orphans];
  }

  async getProviderConfiguration(_userId: string, provider_name: string) {
    const provider = await getRuntimeIdp(provider_name);
    return provider ? getPublicRuntimeIdp(provider) : null;
  }

  async testConnectivity(_userId: string, provider_name: string) {
    const provider = await getRuntimeIdp(provider_name);
    if (!provider) {
      throw new Error("有効な設定が存在しないIdPです");
    }

    const storedConfig = provider.idp_configurations.config as Record<
      string,
      unknown
    >;
    const config =
      provider.source === "database"
        ? resolveIdpConfigSecrets(storedConfig)
        : storedConfig;
    const providerType = provider.provider_type.toUpperCase();
    const checks: ConnectivityCheck[] = [];

    if (providerType === "OIDC") {
      const issuer =
        typeof config.issuer_host === "string"
          ? config.issuer_host.replace(/\/$/, "")
          : "";
      if (!issuer) {
        checks.push({
          name: "OIDC Discovery",
          success: false,
          message: "issuer_hostが設定されていません",
        });
      } else {
        try {
          const response = await fetch(
            `${issuer}/.well-known/openid-configuration`,
            { signal: AbortSignal.timeout(10_000) },
          );
          if (!response.ok) {
            checks.push({
              name: "OIDC Discovery",
              success: false,
              status: response.status,
              message: "Discovery endpointがエラーを返しました",
            });
          } else {
            const metadata = (await response.json()) as Record<string, unknown>;
            const complete = Boolean(
              metadata.authorization_endpoint &&
                metadata.token_endpoint &&
                metadata.jwks_uri,
            );
            checks.push({
              name: "OIDC Discovery",
              success: complete,
              status: response.status,
              message: complete
                ? undefined
                : "Discovery metadataに必要なendpointがありません",
            });
          }
        } catch {
          checks.push({
            name: "OIDC Discovery",
            success: false,
            message: "Discovery endpointに接続できませんでした",
          });
        }
      }
    } else if (providerType === "SAML") {
      const samlConfig = config as Record<string, any>;
      const signAuthnRequest =
        samlConfig.signAuthnRequest ?? samlConfig.sign_authn_request ?? false;
      const requiredFields = ["issuer", "entry_point", "cert", "redirect_uri"];
      if (signAuthnRequest) {
        requiredFields.push("private_key", "public_cert");
      }
      const missingFields = requiredFields.filter((key) => !samlConfig[key]);

      checks.push({
        name: "Required configuration",
        success: missingFields.length === 0,
        message:
          missingFields.length > 0
            ? `未設定: ${missingFields.join(", ")}`
            : undefined,
      });

      if (missingFields.length === 0) {
        try {
          const saml = new SAML({
            issuer: samlConfig.issuer,
            callbackUrl: samlConfig.redirect_uri,
            entryPoint: samlConfig.entry_point,
            idpCert: formatCertificate(samlConfig.cert),
            acceptedClockSkewMs: (samlConfig.clockSkewSeconds || 0) * 1000,
            requestIdExpirationPeriodMs:
              samlConfig.requestIdExpirationMs || 28800000,
            wantAssertionsSigned: samlConfig.wantAssertionsSigned ?? true,
            wantAuthnResponseSigned:
              samlConfig.wantAuthnResponseSigned ?? false,
            disableRequestedAuthnContext:
              samlConfig.disableRequestedAuthnContext ?? false,
            signatureAlgorithm: samlConfig.signature_algorithm || "sha256",
            digestAlgorithm:
              samlConfig.digest_algorithm ||
              samlConfig.signature_algorithm ||
              "sha256",
            identifierFormat:
              samlConfig.identifier_format ||
              "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
            ...(signAuthnRequest
              ? {
                  privateKey: samlConfig.private_key,
                  publicCert: formatCertificate(samlConfig.public_cert),
                }
              : {}),
          });
          const authUrl = await saml.getAuthorizeUrlAsync(
            crypto.randomUUID(),
            undefined,
            {},
          );
          const url = new URL(authUrl);
          const hasSamlRequest = Boolean(url.searchParams.get("SAMLRequest"));

          checks.push({
            name: "SAML AuthnRequest generation",
            success: hasSamlRequest,
            message: hasSamlRequest
              ? undefined
              : "SAMLRequestを生成できませんでした",
          });

          if (signAuthnRequest) {
            const hasSignature = Boolean(
              url.searchParams.get("SigAlg") &&
                url.searchParams.get("Signature"),
            );
            checks.push({
              name: "SAML AuthnRequest signature",
              success: hasSignature,
              message: hasSignature
                ? undefined
                : "AuthnRequest署名を生成できませんでした",
            });
          }
        } catch {
          checks.push({
            name: "SAML AuthnRequest generation",
            success: false,
            message: "AuthnRequestを生成できませんでした。SAML設定と署名鍵を確認してください",
          });
        }
      }
    } else {
      checks.push(
        await fetchEndpoint("Authorization endpoint", config.auth_url),
        await fetchEndpoint("Token endpoint", config.token_url),
        await fetchEndpoint("User info endpoint", config.user_info_url),
      );
    }

    if (providerType !== "SAML") {
      const requiredFields = ["client_id", "client_secret"];
      const missingFields = requiredFields.filter((key) => !config[key]);
      checks.push({
        name: "Required configuration",
        success: missingFields.length === 0,
        message:
          missingFields.length > 0
            ? `未設定: ${missingFields.join(", ")}`
            : undefined,
      });
    }

    return {
      provider_name,
      provider_type: provider.provider_type,
      source: provider.source,
      success: checks.every((check) => check.success),
      checks,
    };
  }

  async cleanupOrphanProvider(_userId: string, provider_name: string) {
    if (getEnvironmentIdp(provider_name)) {
      throw new Error("環境変数で構成されているIdPはクリーンアップできません");
    }

    const runtimeProvider = await getRuntimeIdp(provider_name);
    if (runtimeProvider) {
      throw new Error("有効な設定が存在するIdPはクリーンアップできません");
    }

    return this.repo.cleanupOrphanProvider(provider_name);
  }

  async upsertIdp(_userId: string, provider_name: string, data: any) {
    const runtimeProvider = await getRuntimeIdp(provider_name);
    if (runtimeProvider?.source === "environment") {
      throw new Error("環境変数から設定されているIdPは管理画面から変更できません");
    }

    const existing = await this.repo.getConfiguration(provider_name);
    const rawConfig = existing?.idp_configurations?.config;
    const existingConfig: Record<string, unknown> =
      rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig)
        ? (rawConfig as Record<string, unknown>)
        : {};
    const baseUrl =
      process.env.APP_SITE_URL ??
      process.env.BACKEND_URL ??
      "http://localhost:3000";
    const generatedRedirectUri = `${baseUrl.replace(/\/$/, "")}/auth/${provider_name}/callback`;
    const incomingConfig = stripRedactedValues(data.config ?? {}) as Record<
      string,
      unknown
    >;
    const mergedConfig: Record<string, unknown> = {
      ...existingConfig,
      ...incomingConfig,
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
