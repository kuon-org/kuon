import "dotenv/config";
import express from "express";
import usersRoutes from "./routes/usersRoutes.js";
import articlesRouter from "./routes/articlesRoutes.js";
import tagsRouter from "./routes/tagsRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { swaggerSpec, swaggerUiMiddleware } from "./swagger.js";
import authRouter from "./routes/authRouter.js";
import idpRouter from "./routes/idpRouter.js";
import { init } from "./repositories/initRepository.js";
import { runMigrations } from "./database/migrationRunner.js";
import commentsRouter from "./routes/commentsRouter.js";
import adminRouter from "./routes/adminRouter.js";
import shareRouter from "./routes/shareRoutes.js";
import stocksRoutes from "./routes/stocksRoutes.js";
import pumlRouter from "./routes/plantumlRouter.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");
const uploadsPath = path.resolve(__dirname, "../public/uploads");

const app = express();

// リバプロ設定
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === "true") {
  console.log("Proxy enabled", trustProxy);
  app.set("trust proxy", true);
} else if (trustProxy === "false" || !trustProxy) {
  console.log("Proxy not enabled:", trustProxy);
  app.set("trust proxy", false);
} else if (!isNaN(Number(trustProxy))) {
  console.log("Proxy enabled Hop:", trustProxy);
  app.set("trust proxy", Number(trustProxy));
}

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5050", // フロント側のURL
    credentials: true, // Cookie許可
  }),
);
app.use("/api-docs", ...swaggerUiMiddleware());
app.use("/api", usersRoutes);
app.use("/api", articlesRouter);
app.use("/api", tagsRouter);
app.use("/api", idpRouter);
app.use("/api", commentsRouter);
app.use("/api", adminRouter);
app.use("/api", stocksRoutes);
app.use("/api", pumlRouter);
app.use("/", authRouter);
app.use("/", shareRouter);
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/uploads", express.static(uploadsPath));

// 開発中はViteがフロントエンドを配信するため、Expressからは配信しない。
if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));

  // SPAのルーティング対応
  app.get("{/*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

async function main() {
  await runMigrations();
  await init();
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
