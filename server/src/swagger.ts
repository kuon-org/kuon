// src/swagger.ts
import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
// import type { OpenAPIV3_1 } from "openapi-types";

const definition /* : any */ = {
  openapi: "3.1.0",
  info: {
    title: "Kuon API",
    version: "1.0.0",
    description:
      "オンプレホスティングナレッジ共有アプリ Kuon の API ドキュメント",
  },
  servers: [{ url: "http://localhost:3030", description: "ローカル" }],
  components: {
    securitySchemes: {
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token", // ← あなたのCookie名に合わせる（loginでセットしている名前）
        description:
          "JWT を HttpOnly Cookie で送信。Try it out から送るには credentials: include が必要。",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT Bearer token",
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
      StockList: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          isPublic: { type: "boolean" },
          userId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      StockListDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          isPublic: { type: "boolean" },
          userId: { type: "string", format: "uuid" },
          articles: {
            type: "array",
            items: { $ref: "#/components/schemas/Article" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Article: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          summary: { type: "string" },
          userId: { type: "string", format: "uuid" },
          isPublished: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          avatar_url: { type: "string" },
        },
      },
      IdpProvider: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          provider_name: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
      IdpConfiguration: {
        type: "object",
        properties: {
          provider_name: { type: "string" },
          config: { type: "object" },
        },
      },
    },
  },
  // すべてのエンドポイントで CookieAuth を要求にしたい場合は有効化
  // security: [{ CookieAuth: [] }],
};

const options: Options = {
  definition,
  apis: ["./src/routes/**/*.ts", "./src/routes/**/*.js"],
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
  return [
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOpts),
  ] as const;
};
