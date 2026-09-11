/**
 * ContractBridge shared domain types.
 *
 * These are the single source of truth for UI, mock services, HTTP adapters
 * and the OpenAPI / Markdown exporters. Do not duplicate them.
 */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export type SchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array";

export const SCHEMA_TYPES: SchemaType[] = [
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
];

export type ParameterLocation = "path" | "query" | "header";

/** A schema node. `ref` points at a reusable schema defined on the project. */
export interface ApiSchema {
  type: SchemaType;
  /** OpenAPI `format`, e.g. `uuid`, `date-time`, `int64`, `email`. */
  format?: string;
  nullable?: boolean;
  description?: string;
  /** Allowed values, serialised as strings and coerced by `type` on export. */
  enum?: string[];
  /** Name of a reusable schema on the project. When set, other fields are ignored. */
  ref?: string;
  /** Only for `type: "object"`. */
  properties?: ApiSchemaProperty[];
  /** Only for `type: "array"`. */
  items?: ApiSchema;
}

export interface ApiSchemaProperty extends ApiSchema {
  name: string;
  required: boolean;
}

export interface ApiParameter {
  id: string;
  name: string;
  in: ParameterLocation;
  required: boolean;
  description?: string;
  schema: ApiSchema;
  /** Raw text; parsed as JSON on export when possible. */
  example?: string;
}

export interface ApiRequestBody {
  description?: string;
  required: boolean;
  contentType: string;
  schema: ApiSchema;
  /** Raw text; parsed as JSON on export when possible. */
  example?: string;
}

export interface ApiResponse {
  id: string;
  status: number;
  description: string;
  contentType?: string;
  schema?: ApiSchema;
  /** Raw text; parsed as JSON on export when possible. */
  example?: string;
}

export interface ApiEndpoint {
  id: string;
  projectId: string;
  method: HttpMethod;
  path: string;
  operationId: string;
  summary: string;
  description?: string;
  tags: string[];
  /** Names of project security schemes. Empty means public. */
  security: string[];
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityScheme {
  /** Key used under `components.securitySchemes`. */
  name: string;
  type: "http" | "apiKey";
  description?: string;
  /** For `type: "http"`. */
  scheme?: "bearer" | "basic";
  bearerFormat?: string;
  /** For `type: "apiKey"`. */
  in?: "header" | "query";
  paramName?: string;
}

/** A reusable schema, exported under `components.schemas`. */
export interface NamedSchema {
  name: string;
  description?: string;
  schema: ApiSchema;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  version: string;
  baseUrl: string;
  securitySchemes: SecurityScheme[];
  schemas: NamedSchema[];
  /** Read-only, computed by the service layer. Never sent on create/update. */
  apiCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectInput = Pick<
  Project,
  "name" | "description" | "version" | "baseUrl"
> &
  Partial<Pick<Project, "securitySchemes" | "schemas">>;

export type ApiEndpointInput = Omit<
  ApiEndpoint,
  "id" | "projectId" | "createdAt" | "updatedAt"
>;

export type ExportFormat = "openapi" | "api-spec";

export interface ExportFile {
  format: ExportFormat;
  filename: string;
  language: "yaml" | "markdown";
  content: string;
}
