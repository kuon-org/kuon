import { Router, Request, Response } from "express";
import prisma from "../prisma/client.js";

const idpRouter = Router();

/**
 * アクティブなIdPを取得するエンドポイント
 * フロントでログインボタンを動的に表示する用途
 */
idpRouter.get("/idp/active", async (_req: Request, res: Response) => {
  try {
    const providers = await prisma.identity_providers.findMany({
      where: {
        idp_configurations: { is_active: true },
      },
      include: {
        idp_configurations: true,
      },
      orderBy: { created_at: "asc" },
    });

    const activeProviders = providers.map((p) => ({
      provider_name: p.provider_name,
      display_name: p.display_name,
      provider_type: p.provider_type,
      logo_url: p.logo_url,
      button_color: p.idp_configurations!.button_color,
      text_color: p.idp_configurations!.text_color,
    }));

    res.json(activeProviders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch active IdPs" });
  }
});


export default idpRouter;
