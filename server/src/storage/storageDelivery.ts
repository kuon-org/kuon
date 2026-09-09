import type { NextFunction, Request, Response } from "express";
import { getFileStorage } from "./storageFactory.js";
import { storageConfig } from "./storageConfig.js";

const getStorageKey = (req: Request) => {
  const key = req.path.replace(/^\/+/, "");
  if (!key) return null;
  return key;
};

export const storageDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const key = getStorageKey(req);
  if (!key) return next();

  try {
    const storage = getFileStorage();
    if (!(await storage.exists(key))) return next();

    if (storageConfig.deliveryMode === "redirect") {
      if (!storage.createTemporaryUrl) {
        throw new Error(
          `Storage provider ${storageConfig.provider} does not support redirect delivery`,
        );
      }

      const url = await storage.createTemporaryUrl(key, {
        expiresInSeconds: storageConfig.signedUrlExpiresInSeconds,
      });
      return res.redirect(302, url);
    }

    res.type(key);
    if (req.method === "HEAD") return res.end();

    const stream = await storage.get(key);
    stream.on("error", next);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
