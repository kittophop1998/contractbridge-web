# ContractBridge Backend API Specification

Version: `1.0.0`  
Base URL: `/api/v1`

## Overview

ContractBridge stores API contracts by project. A project owns its API definitions, reusable schemas and security schemes. An API record can only be read, updated or deleted through its owning `projectId`; deleting a project also deletes its APIs.

Requests and successful responses are plain JSON (there is no success envelope). All timestamps are ISO 8601 UTC strings. The complete machine-readable counterpart is [`openapi.yaml`](./openapi.yaml).

## Authentication

Authentication is not implemented in this MVP. Future authentication must not change the request or response payloads in this document.

## Common Error Format

Every non-success response with a body uses this shape:

```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found"
  }
}
```

| Code | HTTP status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | A required field, type, enum, path, or nested contract value is invalid. |
| `PROJECT_NOT_FOUND` | 404 | `projectId` does not exist. |
| `API_NOT_FOUND` | 404 | `apiId` does not exist within `projectId`. |

## Core Models

### Project

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | response | Server-assigned project id. |
| `name` | string | yes | Non-empty project name. |
| `description` | string | yes | Can be empty. |
| `version` | string | yes | Contract version, for example `1.0.0`. |
| `baseUrl` | string (URI) | yes | API server URL used in generated OpenAPI. |
| `securitySchemes` | `SecurityScheme[]` | no | Defaults to `[]` on create. |
| `schemas` | `NamedSchema[]` | no | Defaults to `[]` on create. |
| `apiCount` | integer | response | Read-only count of APIs owned by this project. |
| `createdAt` / `updatedAt` | string (date-time) | response | Server-managed. |

### ApiEndpoint

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | response | Server-assigned API id. |
| `projectId` | string | response | Owning project id; never accepted in endpoint input. |
| `method` | enum | yes | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS`. |
| `path` | string | yes | Must begin with `/`, for example `/api/v1/users/{id}`. |
| `operationId` | string | yes | Stable generated-operation name. |
| `summary` | string | yes | Short endpoint summary. |
| `description` | string | no | Full endpoint description. |
| `tags` | string[] | yes | Empty array is allowed. |
| `security` | string[] | yes | Names from this project's `securitySchemes`; empty array means public. |
| `parameters` | `ApiParameter[]` | yes | Empty array is allowed. |
| `requestBody` | `ApiRequestBody` | no | Omit for endpoints without a body. |
| `responses` | `ApiResponse[]` | yes | Empty array is syntactically valid but clients should provide documented responses. |
| `createdAt` / `updatedAt` | string (date-time) | response | Server-managed. |

### Nested contract models

| Model | Required fields | Fields and rules |
| --- | --- | --- |
| `SecurityScheme` | `name`, `type` | `type` is `http` or `apiKey`; HTTP may include `scheme` (`bearer`/`basic`) and `bearerFormat`; API key may include `in` (`header`/`query`) and `paramName`. `description` is optional. |
| `NamedSchema` | `name`, `schema` | Optional `description`; `schema` is `ApiSchema`. |
| `ApiParameter` | `id`, `name`, `in`, `required`, `schema` | `in` is `path`, `query`, or `header`. Path parameters must have `required: true`. Optional: `description`, `example`. |
| `ApiRequestBody` | `required`, `contentType`, `schema` | Optional: `description`, `example`. Example is raw text that is exported as JSON when it parses. |
| `ApiResponse` | `id`, `status`, `description` | `status` is an integer 100–599. Optional: `contentType`, `schema`, `example`. |
| `ApiSchema` | `type` | `type` is `string`, `number`, `integer`, `boolean`, `object`, or `array`. Optional: `format`, `nullable`, `description`, string `enum`, `ref`, object `properties`, and array `items`. `ref` names a `Project.schemas` schema. |
| `ApiSchemaProperty` | all `ApiSchema` fields plus `name`, `required` | Supports nested object and array schemas. |
| `ExportFile` | `format`, `filename`, `language`, `content` | `format`: `openapi` or `api-spec`; `filename`: `openapi.yaml` or `api-spec.md`; `language`: `yaml` or `markdown`. |

## Endpoints

### GET /projects

Purpose: list all projects for the Projects screen, newest updated first.

- Path/query parameters: none.
- Request body: none.
- Success `200`: `Project[]`.
- Errors: none defined for normal operation.

```json
[
  {
    "id": "prj_farknoi",
    "name": "farknoi-api",
    "description": "Mobile application API.",
    "version": "1.0.0",
    "baseUrl": "https://api.farknoi.com/api/v1",
    "securitySchemes": [],
    "schemas": [],
    "apiCount": 4,
    "createdAt": "2026-01-12T03:20:00.000Z",
    "updatedAt": "2026-08-28T09:05:00.000Z"
  }
]
```

### POST /projects

Purpose: create a new isolated project.

- Path/query parameters: none.
- Request body: `ProjectInput`; `name`, `description`, `version`, and `baseUrl` are required. `securitySchemes` and `schemas` are optional.
- Success `201`: created `Project`.
- Errors: `400 VALIDATION_ERROR` for missing/invalid fields.

```json
{
  "name": "billing-api",
  "description": "Billing and invoice contract.",
  "version": "1.0.0",
  "baseUrl": "https://api.example.com/api/v1",
  "securitySchemes": [],
  "schemas": []
}
```

### GET /projects/{projectId}

Purpose: load project information, schemas, and security schemes for project overview, editing, and API detail.

- Path parameter: `projectId` (required string).
- Query parameters/request body: none.
- Success `200`: one `Project`.
- Errors: `404 PROJECT_NOT_FOUND` when the project does not exist.

### PATCH /projects/{projectId}

Purpose: update only supplied editable project fields.

- Path parameter: `projectId` (required string).
- Query parameters: none.
- Request body: `ProjectPatch`; any combination of `name`, `description`, `version`, `baseUrl`, `securitySchemes`, and `schemas`. Read-only `id`, `apiCount`, `createdAt`, and `updatedAt` must be ignored or rejected.
- Success `200`: updated `Project`.
- Errors: `400 VALIDATION_ERROR`; `404 PROJECT_NOT_FOUND`.

```json
{ "description": "Updated billing contract.", "version": "1.1.0" }
```

### DELETE /projects/{projectId}

Purpose: delete a project and every API definition owned by it.

- Path parameter: `projectId` (required string).
- Query parameters/request body: none.
- Success `204`: no response body.
- Errors: `404 PROJECT_NOT_FOUND`.

### GET /projects/{projectId}/apis

Purpose: list endpoint definitions that belong only to `projectId`.

- Path parameter: `projectId` (required string).
- Query parameters/request body: none.
- Success `200`: `ApiEndpoint[]`.
- Errors: `404 PROJECT_NOT_FOUND`.

### POST /projects/{projectId}/apis

Purpose: add an endpoint definition to a project.

- Path parameter: `projectId` (required string).
- Query parameters: none.
- Request body: `ApiEndpointInput`; all required endpoint fields described in [ApiEndpoint](#apiendpoint) except read-only `id`, `projectId`, timestamps. `requestBody` is optional.
- Success `201`: created `ApiEndpoint` with server-assigned id and timestamps.
- Errors: `400 VALIDATION_ERROR`; `404 PROJECT_NOT_FOUND`.

```json
{
  "method": "GET",
  "path": "/api/v1/users/{id}",
  "operationId": "getUserById",
  "summary": "Get a user",
  "description": "Returns a user by id.",
  "tags": ["Users"],
  "security": ["bearerAuth"],
  "parameters": [
    {
      "id": "prm_user_id",
      "name": "id",
      "in": "path",
      "required": true,
      "schema": { "type": "string", "format": "uuid" }
    }
  ],
  "responses": [
    { "id": "res_200", "status": 200, "description": "Successful response" }
  ]
}
```

### GET /projects/{projectId}/apis/{apiId}

Purpose: load one endpoint definition for the API detail screen.

- Path parameters: `projectId` and `apiId`, both required strings. `apiId` must belong to `projectId`.
- Query parameters/request body: none.
- Success `200`: one `ApiEndpoint`.
- Errors: `404 API_NOT_FOUND` for a missing API or mismatched project.

### PUT /projects/{projectId}/apis/{apiId}

Purpose: replace the editable API definition, including nested parameter/body/response schemas.

- Path parameters: `projectId` and `apiId`, both required strings.
- Query parameters: none.
- Request body: complete `ApiEndpointInput`; all fields required by the model must be present. Server keeps `id`, `projectId`, `createdAt`; it updates `updatedAt`.
- Success `200`: updated `ApiEndpoint`.
- Errors: `400 VALIDATION_ERROR` (including malformed nested schema or a path not beginning with `/`); `404 API_NOT_FOUND`.

### DELETE /projects/{projectId}/apis/{apiId}

Purpose: delete one endpoint definition from its owning project.

- Path parameters: `projectId` and `apiId`, both required strings.
- Query parameters/request body: none.
- Success `204`: no response body.
- Errors: `404 API_NOT_FOUND`.

### GET /projects/{projectId}/exports/openapi

Purpose: generate current project data as valid OpenAPI 3.1 YAML.

- Path parameter: `projectId` (required string).
- Query parameters/request body: none.
- Success `200`: `ExportFile` with `format: "openapi"`, `filename: "openapi.yaml"`, and `language: "yaml"`. `content` is the generated YAML text.
- Errors: `404 PROJECT_NOT_FOUND`.

```json
{
  "format": "openapi",
  "filename": "openapi.yaml",
  "language": "yaml",
  "content": "openapi: 3.1.0\ninfo:\n  title: farknoi-api API\n"
}
```

### GET /projects/{projectId}/exports/api-spec

Purpose: generate the current project data as implementation-ready Markdown.

- Path parameter: `projectId` (required string).
- Query parameters/request body: none.
- Success `200`: `ExportFile` with `format: "api-spec"`, `filename: "api-spec.md"`, and `language: "markdown"`. `content` is the generated Markdown text.
- Errors: `404 PROJECT_NOT_FOUND`.

```json
{
  "format": "api-spec",
  "filename": "api-spec.md",
  "language": "markdown",
  "content": "# farknoi-api API Specification\n"
}
```
