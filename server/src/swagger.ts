// src/swagger.ts
import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
// import type { OpenAPIV3_1 } from "openapi-types";

const definition /* : any */ = {
  openapi: "3.1.0",
  info: {
    title: "Kuon API",
    version: "1.0.0",
    description: "オンプレホスティングナレッジ共有アプリ Kuon の API ドキュメント",
  },
  servers: [{ url: "http://localhost:3030", description: "ローカル" }],
  components: {
    securitySchemes: {
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token", // ← あなたのCookie名に合わせる（loginでセットしている名前）
        description:
          "JWT を HttpOnly Cookie で送信。Try it out から送るには credentials: include が必要。",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          displayName: { type: "string" },
          email: { type: "string", format: "email" },
        },
        required: ["id", "username"],
      },
    },
  },
  // すべてのエンドポイントで CookieAuth を要求にしたい場合は有効化
  // security: [{ CookieAuth: [] }],
};

const options: Options = {
  definition,
  apis: [
    "./src/routes/**/*.ts",
    "./src/routes/**/*.js",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiMiddleware = () => {
  const swaggerUiOpts: swaggerUi.SwaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      requestInterceptor: (req: any) => {
        // Swagger UI の fetch に Cookie を付ける
        req.credentials = "include";
        return req;
      },
    },
  };
  return [swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOpts)] as const;
};