import {
  FARKNOI_PROJECT_ID,
  INCENTIVE_PROJECT_ID,
} from "@/mocks/data/projects";
import type { ApiEndpoint, ApiResponse, ApiSchema } from "@/types";

function errorResponse(
  status: number,
  description: string,
  code: string,
  message: string,
): ApiResponse {
  return {
    id: `res_${status}_${code.toLowerCase()}`,
    status,
    description,
    contentType: "application/json",
    schema: { type: "object", ref: "Error" },
    example: JSON.stringify({ error: { code, message } }, null, 2),
  };
}

const UNAUTHORIZED = errorResponse(
  401,
  "Missing or expired access token.",
  "UNAUTHORIZED",
  "Authentication required",
);

/** `{ data: [...], meta: PageMeta }` used by every list endpoint. */
function pagedSchema(itemRef: string): ApiSchema {
  return {
    type: "object",
    properties: [
      {
        name: "data",
        required: true,
        type: "array",
        items: { type: "object", ref: itemRef },
      },
      { name: "meta", required: true, type: "object", ref: "PageMeta" },
    ],
  };
}

export const seedApis: ApiEndpoint[] = [
  {
    id: "api_farknoi_list_users",
    projectId: FARKNOI_PROJECT_ID,
    method: "GET",
    path: "/api/v1/users",
    operationId: "listUsers",
    summary: "List users",
    description:
      "Returns a paginated list of accounts. Only admins may list users; other roles receive 403.",
    tags: ["Users"],
    security: ["bearerAuth"],
    createdAt: "2026-01-14T04:00:00.000Z",
    updatedAt: "2026-08-20T08:10:00.000Z",
    parameters: [
      {
        id: "prm_users_page",
        name: "page",
        in: "query",
        required: false,
        description: "1-based page number.",
        schema: { type: "integer", format: "int32" },
        example: "1",
      },
      {
        id: "prm_users_per_page",
        name: "perPage",
        in: "query",
        required: false,
        description: "Items per page, max 100.",
        schema: { type: "integer", format: "int32" },
        example: "20",
      },
      {
        id: "prm_users_search",
        name: "search",
        in: "query",
        required: false,
        description: "Case-insensitive match on email or display name.",
        schema: { type: "string" },
        example: "\"ann\"",
      },
    ],
    responses: [
      {
        id: "res_users_200",
        status: 200,
        description: "A page of users.",
        contentType: "application/json",
        schema: pagedSchema("User"),
        example: JSON.stringify(
          {
            data: [
              {
                id: "6b2f0d1e-7a54-4a0e-9a1c-2f4f1c8d9a01",
                email: "ann@farknoi.com",
                displayName: "Ann S.",
                avatarUrl: null,
                role: "admin",
                createdAt: "2026-01-12T03:20:00Z",
              },
            ],
            meta: { page: 1, perPage: 20, total: 143 },
          },
          null,
          2,
        ),
      },
      UNAUTHORIZED,
      errorResponse(
        403,
        "The caller is authenticated but not an admin.",
        "FORBIDDEN",
        "You do not have access to this resource",
      ),
    ],
  },
  {
    id: "api_farknoi_get_user",
    projectId: FARKNOI_PROJECT_ID,
    method: "GET",
    path: "/api/v1/users/{id}",
    operationId: "getUserById",
    summary: "Get a user by id",
    description: "Returns a single account. Members may only read their own record.",
    tags: ["Users"],
    security: ["bearerAuth"],
    createdAt: "2026-01-14T04:05:00.000Z",
    updatedAt: "2026-08-20T08:12:00.000Z",
    parameters: [
      {
        id: "prm_user_id",
        name: "id",
        in: "path",
        required: true,
        description: "User id.",
        schema: { type: "string", format: "uuid" },
        example: "\"6b2f0d1e-7a54-4a0e-9a1c-2f4f1c8d9a01\"",
      },
    ],
    responses: [
      {
        id: "res_user_200",
        status: 200,
        description: "The requested user.",
        contentType: "application/json",
        schema: { type: "object", ref: "User" },
        example: JSON.stringify(
          {
            id: "6b2f0d1e-7a54-4a0e-9a1c-2f4f1c8d9a01",
            email: "ann@farknoi.com",
            displayName: "Ann S.",
            avatarUrl: null,
            role: "admin",
            createdAt: "2026-01-12T03:20:00Z",
          },
          null,
          2,
        ),
      },
      UNAUTHORIZED,
      errorResponse(
        404,
        "No user matches the given id.",
        "USER_NOT_FOUND",
        "User not found",
      ),
    ],
  },
  {
    id: "api_farknoi_login",
    projectId: FARKNOI_PROJECT_ID,
    method: "POST",
    path: "/api/v1/auth/login",
    operationId: "login",
    summary: "Exchange credentials for an access token",
    description:
      "Public endpoint. Returns a JWT used as `Authorization: Bearer <token>` on every other endpoint.",
    tags: ["Auth"],
    security: [],
    createdAt: "2026-01-13T02:00:00.000Z",
    updatedAt: "2026-08-28T09:05:00.000Z",
    parameters: [],
    requestBody: {
      required: true,
      contentType: "application/json",
      description: "Email and password of an existing account.",
      schema: {
        type: "object",
        properties: [
          { name: "email", required: true, type: "string", format: "email" },
          {
            name: "password",
            required: true,
            type: "string",
            format: "password",
            description: "Minimum 8 characters.",
          },
          {
            name: "rememberMe",
            required: false,
            type: "boolean",
            description: "Issues a 30 day refresh token when true.",
          },
        ],
      },
      example: JSON.stringify(
        { email: "ann@farknoi.com", password: "s3cret-pass", rememberMe: true },
        null,
        2,
      ),
    },
    responses: [
      {
        id: "res_login_200",
        status: 200,
        description: "Credentials accepted.",
        contentType: "application/json",
        schema: {
          type: "object",
          properties: [
            { name: "accessToken", required: true, type: "string" },
            {
              name: "expiresIn",
              required: true,
              type: "integer",
              format: "int32",
              description: "Token lifetime in seconds.",
            },
            { name: "user", required: true, type: "object", ref: "User" },
          ],
        },
        example: JSON.stringify(
          {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            expiresIn: 3600,
            user: {
              id: "6b2f0d1e-7a54-4a0e-9a1c-2f4f1c8d9a01",
              email: "ann@farknoi.com",
              displayName: "Ann S.",
              avatarUrl: null,
              role: "admin",
              createdAt: "2026-01-12T03:20:00Z",
            },
          },
          null,
          2,
        ),
      },
      errorResponse(
        400,
        "Body failed validation.",
        "VALIDATION_ERROR",
        "email must be a valid email address",
      ),
      errorResponse(
        401,
        "Email or password does not match.",
        "INVALID_CREDENTIALS",
        "Email or password is incorrect",
      ),
    ],
  },
  {
    id: "api_farknoi_list_news",
    projectId: FARKNOI_PROJECT_ID,
    method: "GET",
    path: "/api/v1/news",
    operationId: "listNews",
    summary: "List published news articles",
    description: "Public feed, newest first. Unpublished drafts are never returned.",
    tags: ["News"],
    security: [],
    createdAt: "2026-02-01T05:00:00.000Z",
    updatedAt: "2026-07-11T10:00:00.000Z",
    parameters: [
      {
        id: "prm_news_page",
        name: "page",
        in: "query",
        required: false,
        description: "1-based page number.",
        schema: { type: "integer", format: "int32" },
        example: "1",
      },
      {
        id: "prm_news_tag",
        name: "tag",
        in: "query",
        required: false,
        description: "Filter by a single tag.",
        schema: { type: "string", enum: ["product", "event", "promotion"] },
        example: "\"promotion\"",
      },
    ],
    responses: [
      {
        id: "res_news_200",
        status: 200,
        description: "A page of articles.",
        contentType: "application/json",
        schema: pagedSchema("NewsArticle"),
        example: JSON.stringify(
          {
            data: [
              {
                id: "9d1a2b33-0c41-4d7a-9f10-5e6a7b8c9d00",
                title: "Farknoi 2.0 is live",
                summary: "A faster feed and a redesigned profile.",
                coverUrl: "https://cdn.farknoi.com/news/2-0.png",
                tags: ["product"],
                publishedAt: "2026-07-11T09:00:00Z",
              },
            ],
            meta: { page: 1, perPage: 20, total: 37 },
          },
          null,
          2,
        ),
      },
      errorResponse(
        400,
        "Unknown tag or malformed pagination.",
        "VALIDATION_ERROR",
        "tag must be one of product, event, promotion",
      ),
    ],
  },
  {
    id: "api_incentive_create_order",
    projectId: INCENTIVE_PROJECT_ID,
    method: "POST",
    path: "/api/v1/orders",
    operationId: "createOrder",
    summary: "Register an order for incentive calculation",
    description:
      "Orders are idempotent on `externalId`; posting the same id twice returns the original order.",
    tags: ["Orders"],
    security: ["bearerAuth", "serviceKey"],
    createdAt: "2026-03-04T07:00:00.000Z",
    updatedAt: "2026-09-01T11:30:00.000Z",
    parameters: [
      {
        id: "prm_order_idempotency",
        name: "Idempotency-Key",
        in: "header",
        required: false,
        description: "Client generated key, echoed back on retries.",
        schema: { type: "string", format: "uuid" },
      },
    ],
    requestBody: {
      required: true,
      contentType: "application/json",
      description: "The confirmed order, including every line item.",
      schema: {
        type: "object",
        properties: [
          {
            name: "externalId",
            required: true,
            type: "string",
            description: "Order id in the source system.",
          },
          { name: "sellerId", required: true, type: "string", format: "uuid" },
          {
            name: "currency",
            required: true,
            type: "string",
            enum: ["THB", "USD"],
          },
          {
            name: "items",
            required: true,
            type: "array",
            items: { type: "object", ref: "OrderItem" },
          },
          {
            name: "note",
            required: false,
            type: "string",
            nullable: true,
            description: "Free text kept for auditing.",
          },
        ],
      },
      example: JSON.stringify(
        {
          externalId: "SO-2026-00871",
          sellerId: "b41d8c70-9a2e-4f31-8c5a-1d2e3f4a5b60",
          currency: "THB",
          items: [
            { sku: "FK-1001", name: "Starter pack", quantity: 2, unitPrice: 1290 },
          ],
          note: null,
        },
        null,
        2,
      ),
    },
    responses: [
      {
        id: "res_order_201",
        status: 201,
        description: "Order stored and queued for incentive calculation.",
        contentType: "application/json",
        schema: { type: "object", ref: "Order" },
        example: JSON.stringify(
          {
            id: "0f3c9a52-6d8b-4c1e-a7f2-88b3c4d5e6f7",
            sellerId: "b41d8c70-9a2e-4f31-8c5a-1d2e3f4a5b60",
            status: "confirmed",
            currency: "THB",
            totalAmount: 2580,
            items: [
              { sku: "FK-1001", name: "Starter pack", quantity: 2, unitPrice: 1290 },
            ],
            createdAt: "2026-09-01T11:30:00Z",
          },
          null,
          2,
        ),
      },
      errorResponse(
        400,
        "Body failed validation.",
        "VALIDATION_ERROR",
        "items must contain at least one entry",
      ),
      UNAUTHORIZED,
      errorResponse(
        409,
        "An order with the same externalId already exists with different contents.",
        "ORDER_CONFLICT",
        "Order already exists with different contents",
      ),
    ],
  },
  {
    id: "api_incentive_get_order",
    projectId: INCENTIVE_PROJECT_ID,
    method: "GET",
    path: "/api/v1/orders/{orderId}",
    operationId: "getOrderById",
    summary: "Get an order with its calculated incentive",
    description: "Returns the stored order. `status` reflects the latest sync.",
    tags: ["Orders"],
    security: ["bearerAuth"],
    createdAt: "2026-03-05T07:20:00.000Z",
    updatedAt: "2026-08-14T06:45:00.000Z",
    parameters: [
      {
        id: "prm_order_id",
        name: "orderId",
        in: "path",
        required: true,
        description: "Incentive order id.",
        schema: { type: "string", format: "uuid" },
        example: "\"0f3c9a52-6d8b-4c1e-a7f2-88b3c4d5e6f7\"",
      },
    ],
    responses: [
      {
        id: "res_order_get_200",
        status: 200,
        description: "The requested order.",
        contentType: "application/json",
        schema: { type: "object", ref: "Order" },
        example: JSON.stringify(
          {
            id: "0f3c9a52-6d8b-4c1e-a7f2-88b3c4d5e6f7",
            sellerId: "b41d8c70-9a2e-4f31-8c5a-1d2e3f4a5b60",
            status: "confirmed",
            currency: "THB",
            totalAmount: 2580,
            items: [
              { sku: "FK-1001", name: "Starter pack", quantity: 2, unitPrice: 1290 },
            ],
            createdAt: "2026-09-01T11:30:00Z",
          },
          null,
          2,
        ),
      },
      UNAUTHORIZED,
      errorResponse(
        404,
        "No order matches the given id.",
        "ORDER_NOT_FOUND",
        "Order not found",
      ),
    ],
  },
];
