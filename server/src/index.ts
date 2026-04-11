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
import commentsRouter from "./routes/commnetsRouter.js";
import adminRouter from "./routes/adminRouter.js";
import shareRouter from "./routes/shareRoutes.js";
import stocksRoutes from "./routes/stocksRoutes.js";
import pumlRouter from "./routes/plantumlRouter.js";
const app = express();
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
app.use("/uploads", express.static("public/uploads"));
async function main() {
  await init();
  app.listen(3030, () => {
    console.log("Server running on http://localhost:3030");
  });
}

main().catch(console.error);
