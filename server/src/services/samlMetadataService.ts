import { SAML } from "@node-saml/node-saml";
import { getRuntimeIdp } from "./runtimeIdpService.js";
import { resolveIdpConfigSecrets } from "../utils/idpConfigSecrets.js";

const formatCert = (cert: string): string => {
  if (!cert) return "";

  const cleanCert = cert
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");

  return `-----BEGIN CERTIFICATE-----\n${cleanCert}\n-----END CERTIFICATE-----`;
};

export const generateSamlServiceProviderMetadata = async (
  providerName: string,
): Promise<string> => {
  const provider = await getRuntimeIdp(providerName);
  if (!provider || provider.provider_type.toUpperCase() !== "SAML") {
    throw new Error("Invalid SAML provider");
  }

  const storedConfig = provider.idp_configurations.config;
  const config =
    provider.source === "database"
      ? resolveIdpConfigSecrets(storedConfig)
      : storedConfig;
  const signAuthnRequest = Boolean(
    config.signAuthnRequest ?? config.sign_authn_request ?? false,
  );
  const privateKey =
    typeof config.private_key === "string" ? config.private_key : "";
  const publicCert =
    typeof config.public_cert === "string" ? formatCert(config.public_cert) : "";

  if (signAuthnRequest && (!privateKey || !publicCert)) {
    throw new Error(
      "SAML AuthnRequest signing requires both private_key and public_cert",
    );
  }

  const saml = new SAML({
    issuer: String(config.issuer ?? ""),
    callbackUrl: String(config.redirect_uri ?? ""),
    entryPoint: String(config.entry_point ?? ""),
    idpCert: formatCert(String(config.cert ?? "")),
    wantAssertionsSigned: (config.wantAssertionsSigned as boolean | undefined) ?? true,
    wantAuthnResponseSigned:
      (config.wantAuthnResponseSigned as boolean | undefined) ?? false,
    signatureAlgorithm: (config.signature_algorithm as "sha1" | "sha256" | "sha512" | undefined) ?? "sha256",
    digestAlgorithm:
      (config.digest_algorithm as string | undefined) ??
      (config.signature_algorithm as string | undefined) ??
      "sha256",
    ...(signAuthnRequest ? { privateKey, publicCert } : {}),
  });

  return saml.generateServiceProviderMetadata(
    null,
    signAuthnRequest ? publicCert : null,
  );
};
