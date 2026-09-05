import { AuthRequest, isAuthenticated } from "../middlewares/auth.js";
import { IdpConfigurationsService } from "../services/idpConfigurationsService.js";
import { AppError, ValidationError } from "../errors/AppError.js";
import { Request, Response } from "express";

export class IdpController {
  constructor(private idpService: IdpConfigurationsService) {}

  private requireUser(req: AuthRequest) {
    if (!isAuthenticated(req)) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }
    return req.user;
  }

  private internal(code: string, message: string, error: unknown) {
    console.error(message, error);
    return new AppError(500, code, message);
  }

  getActiveIdp = async (_req: Request, res: Response) => {
    try {
      res.json(await this.idpService.getProviders());
    } catch (error) {
      throw this.internal("IDP_LIST_FETCH_FAILED", "Failed to fetch identity providers", error);
    }
  };

  getAllProviders = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(await this.idpService.getAllProvidersList(user.userId));
    } catch (error) {
      throw this.internal("IDP_LIST_FETCH_FAILED", "Failed to fetch identity providers", error);
    }
  };

  getIdpConf = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.idpService.getProviderConfiguration(
          user.userId,
          String(req.params.provider_name),
        ),
      );
    } catch (error) {
      throw this.internal("IDP_CONFIGURATION_FETCH_FAILED", "Failed to fetch IdP configuration", error);
    }
  };

  discoverOidc = async (req: AuthRequest, res: Response) => {
    this.requireUser(req);
    const { issuer_host } = req.query;
    if (typeof issuer_host !== "string" || !issuer_host.trim()) {
      throw new ValidationError({ issuer_host: ["ISSUER_HOST_REQUIRED"] });
    }

    try {
      const discoveryUrl = `${issuer_host.replace(/\/$/, "")}/.well-known/openid-configuration`;
      const response = await fetch(discoveryUrl);
      if (!response.ok) {
        throw new Error(`Discovery request failed: ${response.status}`);
      }
      const data = (await response.json()) as {
        authorization_endpoint?: string;
        token_endpoint?: string;
        userinfo_endpoint?: string;
      };
      res.json({
        auth_url: data.authorization_endpoint,
        token_url: data.token_endpoint,
        user_info_url: data.userinfo_endpoint,
      });
    } catch (error) {
      console.error("OIDC discovery failed", error);
      throw new AppError(502, "OIDC_DISCOVERY_FAILED", "OIDC discovery failed");
    }
  };

  upsertIdp = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    const { provider_name, ...restData } = req.body;
    if (typeof provider_name !== "string" || !provider_name.trim()) {
      throw new ValidationError({ provider_name: ["PROVIDER_NAME_REQUIRED"] });
    }

    try {
      res.json(await this.idpService.upsertIdp(user.userId, provider_name, restData));
    } catch (error) {
      throw this.internal("IDP_SAVE_FAILED", "Failed to save identity provider", error);
    }
  };

  toggleActive = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      await this.idpService.toggleActive(user.userId, String(req.params.provider_name));
      res.json({ message: "ok" });
    } catch (error) {
      throw this.internal("IDP_STATUS_UPDATE_FAILED", "Failed to update identity provider status", error);
    }
  };

  testConnectivity = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.idpService.testConnectivity(
          user.userId,
          String(req.params.provider_name),
        ),
      );
    } catch (error) {
      console.error("IdP connectivity test failed", error);
      throw new AppError(502, "IDP_CONNECTIVITY_TEST_FAILED", "Identity provider connectivity test failed");
    }
  };

  cleanupOrphanProvider = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.idpService.cleanupOrphanProvider(
          user.userId,
          String(req.params.provider_name),
        ),
      );
    } catch (error) {
      console.error("Orphan IdP cleanup failed", error);
      throw new AppError(409, "IDP_CLEANUP_CONFLICT", "Identity provider cleanup conflict");
    }
  };

  deleteIdp = async (req: AuthRequest, res: Response) => {
    const user = this.requireUser(req);
    try {
      res.json(
        await this.idpService.deleteIdp(user.userId, String(req.params.provider_name)),
      );
    } catch (error) {
      throw this.internal("IDP_DELETE_FAILED", "Failed to delete identity provider", error);
    }
  };
}
