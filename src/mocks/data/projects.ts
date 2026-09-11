import type { Project } from "@/types";

export const FARKNOI_PROJECT_ID = "prj_farknoi";
export const INCENTIVE_PROJECT_ID = "prj_incentive";

const errorSchema = {
  type: "object" as const,
  properties: [
    {
      name: "error",
      required: true,
      type: "object" as const,
      properties: [
        {
          name: "code",
          required: true,
          type: "string" as const,
          description: "Machine readable error code.",
        },
        {
          name: "message",
          required: true,
          type: "string" as const,
          description: "Human readable message, safe to show to users.",
        },
      ],
    },
  ],
};

export const seedProjects: Project[] = [
  {
    id: FARKNOI_PROJECT_ID,
    name: "farknoi-api",
    description:
      "Public API for the Farknoi mobile app: authentication, user profiles and the news feed.",
    version: "1.4.0",
    baseUrl: "https://api.farknoi.com/api/v1",
    apiCount: 0,
    createdAt: "2026-01-12T03:20:00.000Z",
    updatedAt: "2026-08-28T09:05:00.000Z",
    securitySchemes: [
      {
        name: "bearerAuth",
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token returned by POST /auth/login.",
      },
    ],
    schemas: [
      {
        name: "User",
        description: "A registered Farknoi account.",
        schema: {
          type: "object",
          properties: [
            { name: "id", required: true, type: "string", format: "uuid" },
            { name: "email", required: true, type: "string", format: "email" },
            { name: "displayName", required: true, type: "string" },
            {
              name: "avatarUrl",
              required: false,
              type: "string",
              format: "uri",
              nullable: true,
            },
            {
              name: "role",
              required: true,
              type: "string",
              enum: ["admin", "editor", "member"],
            },
            {
              name: "createdAt",
              required: true,
              type: "string",
              format: "date-time",
            },
          ],
        },
      },
      {
        name: "NewsArticle",
        description: "An article shown in the app news feed.",
        schema: {
          type: "object",
          properties: [
            { name: "id", required: true, type: "string", format: "uuid" },
            { name: "title", required: true, type: "string" },
            { name: "summary", required: true, type: "string" },
            { name: "coverUrl", required: false, type: "string", nullable: true },
            {
              name: "tags",
              required: true,
              type: "array",
              items: { type: "string" },
            },
            {
              name: "publishedAt",
              required: true,
              type: "string",
              format: "date-time",
            },
          ],
        },
      },
      {
        name: "PageMeta",
        description: "Pagination envelope shared by every list endpoint.",
        schema: {
          type: "object",
          properties: [
            { name: "page", required: true, type: "integer", format: "int32" },
            { name: "perPage", required: true, type: "integer", format: "int32" },
            { name: "total", required: true, type: "integer", format: "int64" },
          ],
        },
      },
      {
        name: "Error",
        description: "Standard error envelope.",
        schema: errorSchema,
      },
    ],
  },
  {
    id: INCENTIVE_PROJECT_ID,
    name: "incentive-api",
    description:
      "Back-office API that calculates sales incentives from orders and payout rules.",
    version: "0.9.0",
    baseUrl: "https://incentive.internal/api/v1",
    apiCount: 0,
    createdAt: "2026-03-02T06:40:00.000Z",
    updatedAt: "2026-09-01T11:30:00.000Z",
    securitySchemes: [
      {
        name: "bearerAuth",
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Staff access token issued by the SSO gateway.",
      },
      {
        name: "serviceKey",
        type: "apiKey",
        in: "header",
        paramName: "X-Service-Key",
        description: "Machine-to-machine key for internal schedulers.",
      },
    ],
    schemas: [
      {
        name: "OrderItem",
        description: "A single line inside an order.",
        schema: {
          type: "object",
          properties: [
            { name: "sku", required: true, type: "string" },
            { name: "name", required: true, type: "string" },
            { name: "quantity", required: true, type: "integer", format: "int32" },
            { name: "unitPrice", required: true, type: "number", format: "double" },
          ],
        },
      },
      {
        name: "Order",
        description: "A confirmed sales order used as incentive input.",
        schema: {
          type: "object",
          properties: [
            { name: "id", required: true, type: "string", format: "uuid" },
            { name: "sellerId", required: true, type: "string", format: "uuid" },
            {
              name: "status",
              required: true,
              type: "string",
              enum: ["pending", "confirmed", "cancelled"],
            },
            { name: "currency", required: true, type: "string", enum: ["THB", "USD"] },
            { name: "totalAmount", required: true, type: "number", format: "double" },
            {
              name: "items",
              required: true,
              type: "array",
              items: { type: "object", ref: "OrderItem" },
            },
            {
              name: "createdAt",
              required: true,
              type: "string",
              format: "date-time",
            },
          ],
        },
      },
      {
        name: "Error",
        description: "Standard error envelope.",
        schema: errorSchema,
      },
    ],
  },
];
