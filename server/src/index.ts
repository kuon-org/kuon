import "dotenv/config";
import express from "express";
import usersRoutes from "./routes/usersRoutes.js";
import localAuthRoutes from "./routes/localAuthRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import totpRoutes from "./routes/totpRoutes.js";
import articlesRouter from "./routes/articlesRoutes.js";
import tagsRouter from "./routes/tagsRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { swaggerSpec, swaggerUiMiddleware } from "./swagger.js";
import authRouter from "./routes/authRouter.js";
import idpRouter from "./routes/idpRouter.js";
import { init } from "./repositories/initRepository.js";
import { connectDatabaseWithRetry } from "./database/connect.js";
import { runMigrations } from "./database/migrationRunner.js";
import commentsRouter from "./routes/commentsRouter.js";
import adminRouter from "./routes/adminRouter.js";
import contentAuthorizationRouter from "./routes/contentAuthorizationRouter.js";
import shareRouter from "./routes/shareRoutes.js";
import stocksRoutes from "./routes/stocksRoutes.js";
import pumlRouter from "./routes/plantumlRouter.js";
import serverSettingsRouter from "./routes/serverSettingsRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import serverEventRouter from "./routes/serverEventRouter.js";
import { requireSiteAuthentication } from "./middlewares/siteAccess.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { serverSettingsService } from "./services/serverSettingsService.js";
import { runtimeMaintenanceGate } from "./services/runtimeMaintenanceService.js";
import { storageDelivery } from "./storage/storageDelivery.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

const app = express();
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === "true") app.set("trust proxy", true);
else if (trustProxy === "false" || !trustProxy) app.set("trust proxy", false);
else if (!isNaN(Number(trustProxy))) app.set("trust proxy", Number(trustProxy));

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5050", credentials: true }));
app.use("/api-docs", ...swaggerUiMiddleware());

// Public settings must stay reachable so the SPA can switch to the maintenance screen.
app.use("/api", serverSettingsRouter);

// Restore uses an in-memory lock to stop DB-backed API access while keeping the SPA alive.
app.use("/api", runtimeMaintenanceGate);

// Authentication bootstrap endpoints must remain reachable while login is required.
app.use("/api", localAuthRoutes);
app.use("/api", passwordResetRoutes);
app.use("/api", totpRoutes);
app.use("/api", usersRoutes);
app.use("/api", idpRouter);
app.use("/api", adminRouter);
app.use("/api", notificationRouter);
app.use("/api", serverEventRouter);

// Permission guards are mounted ahead of the existing content routers. They only
// match mutating routes that require an explicit Kuon capability.
app.use("/api", requireSiteAuthentication, contentAuthorizationRouter);

// Anonymous content APIs are gated only when require_authentication is enabled.
app.use("/api", requireSiteAuthentication, articlesRouter);
app.use("/api", requireSiteAuthentication, tagsRouter);
app.use("/api", requireSiteAuthentication, commentsRouter);
app.use("/api", requireSiteAuthentication, stocksRoutes);
app.use("/api", requireSiteAuthentication, pumlRouter);

// External authentication routes are DB-backed and must not run during restore.
app.use("/auth", runtimeMaintenanceGate);
app.use("/", authRouter);

// Standard password-manager discovery endpoint for logged-in password changes.
app.get("/.well-known/change-password", (_req, res) => {
  res.redirect(302, "/settings/password");
});

// Shared content and uploads depend on the restored DB/files, so block them during restore.
app.use(
  "/share",
  runtimeMaintenanceGate,
  requireSiteAuthentication,
  shareRouter,
);
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use(
  "/uploads",
  runtimeMaintenanceGate,
  requireSiteAuthentication,
  storageDelivery,
);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  app.get("{/*path}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

app.use(errorHandler);

async function main() {
  await connectDatabaseWithRetry();
  await runMigrations();
  await init();
  await serverSettingsService.initialize();
  const port = Number(process.env.SERVER_PORT ?? 3030);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(process.env.NODE_ENV);
  });
}

main().catch((error) => {
  console.error("❌ Server startup failed:", error);
  process.exit(1);
});