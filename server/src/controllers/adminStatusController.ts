import type { Request, Response } from "express";
import prisma from "../prisma/client.js";

const ENVIRONMENT_KEYS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "PLANTUML_URL",
  "SERVER_PORT",
  "TRUST_PROXY",
  "NODE_ENV",
] as const;

export const adminStatusController = {
  getStatus: async (_req: Request, res: Response) => {
    let databaseStatus: "connected" | "error" = "connected";
    let postgresVersion: string | null = null;

    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ version: string }>>("SELECT version()");
      postgresVersion = rows[0]?.version ?? null;
    } catch {
      databaseStatus = "error";
    }

    const environment = ENVIRONMENT_KEYS.map((key) => ({
      key,
      configured: Boolean(process.env[key]),
      source: "environment" as const,
    }));

    res.json({
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      environmentName: process.env.NODE_ENV ?? null,
      database: {
        status: databaseStatus,
        postgresVersion,
      },
      environment,
    });
  },
};
