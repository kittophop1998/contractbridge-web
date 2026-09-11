import { coerceEnum, parseExample, sortEndpoints } from "@/lib/schema";
import { toYaml, type YamlValue } from "@/lib/yaml";
import type {
  ApiEndpoint,
  ApiParameter,
  ApiResponse,
  ApiSchema,
  Project,
  SecurityScheme,
} from "@/types";

type YamlObject = { [key: string]: YamlValue };

function schemaToOpenApi(schema: ApiSchema): YamlObject {
  if (schema.ref) {
    const ref: YamlObject = { $ref: `#/components/schemas/${schema.ref}` };
    // OpenAPI 3.1: a nullable ref is expressed as a union.
    return schema.nullable ? { anyOf: [ref, { type: "null" }] } : ref;
  }

  const node: YamlObject = {
    type: schema.nullable ? [schema.type, "null"] : schema.type,
    format: schema.format || undefined,
    description: schema.description || undefined,
  };

  if (schema.enum?.length) node.enum = coerceEnum(schema) as YamlValue;

  if (schema.type === "object") {
    const properties: YamlObject = {};
    const required: string[] = [];
    for (const property of schema.properties ?? []) {
      if (!property.name) continue;
      properties[property.name] = schemaToOpenApi(property);
      if (property.required) required.push(property.name);
    }
    node.properties = properties;
    if (required.length) node.required = required;
  }

  if (schema.type === "array") {
    node.items = schemaToOpenApi(schema.items ?? { type: "string" });
  }

  return node;
}

function parameterToOpenApi(parameter: ApiParameter): YamlObject {
  return {
    name: parameter.name,
    in: parameter.in,
    required: parameter.in === "path" ? true : parameter.required,
    description: parameter.description || undefined,
    schema: schemaToOpenApi(parameter.schema),
    example: parseExample(parameter.example) as YamlValue,
  };
}

function responseToOpenApi(response: ApiResponse): YamlObject {
  const node: YamlObject = { description: response.description };
  if (response.schema) {
    node.content = {
      [response.contentType || "application/json"]: {
        schema: schemaToOpenApi(response.schema),
        example: parseExample(response.example) as YamlValue,
      },
    };
  }
  return node;
}

function securitySchemeToOpenApi(scheme: SecurityScheme): YamlObject {
  if (scheme.type === "apiKey") {
    return {
      type: "apiKey",
      in: scheme.in ?? "header",
      name: scheme.paramName ?? scheme.name,
      description: scheme.description || undefined,
    };
  }
  return {
    type: "http",
    scheme: scheme.scheme ?? "bearer",
    bearerFormat: scheme.bearerFormat || undefined,
    description: scheme.description || undefined,
  };
}

function operationToOpenApi(endpoint: ApiEndpoint): YamlObject {
  const operation: YamlObject = {
    operationId: endpoint.operationId || undefined,
    summary: endpoint.summary || undefined,
    description: endpoint.description || undefined,
    tags: endpoint.tags.length ? endpoint.tags : undefined,
  };

  if (endpoint.security.length) {
    operation.security = endpoint.security.map((name) => ({ [name]: [] }));
  }

  if (endpoint.parameters.length) {
    operation.parameters = endpoint.parameters.map(parameterToOpenApi);
  }

  if (endpoint.requestBody) {
    const { contentType, schema, example, description, required } =
      endpoint.requestBody;
    operation.requestBody = {
      description: description || undefined,
      required,
      content: {
        [contentType || "application/json"]: {
          schema: schemaToOpenApi(schema),
          example: parseExample(example) as YamlValue,
        },
      },
    };
  }

  const responses: YamlObject = {};
  for (const response of [...endpoint.responses].sort(
    (a, b) => a.status - b.status,
  )) {
    responses[String(response.status)] = responseToOpenApi(response);
  }
  operation.responses = Object.keys(responses).length
    ? responses
    : { "200": { description: "OK" } };

  return operation;
}

export function buildOpenApiDocument(
  project: Project,
  endpoints: ApiEndpoint[],
): YamlObject {
  const paths: YamlObject = {};
  for (const endpoint of sortEndpoints(endpoints)) {
    const path = (paths[endpoint.path] ??= {}) as YamlObject;
    path[endpoint.method.toLowerCase()] = operationToOpenApi(endpoint);
  }

  const schemas: YamlObject = {};
  for (const named of project.schemas) {
    schemas[named.name] = {
      ...schemaToOpenApi(named.schema),
      description: named.description || named.schema.description || undefined,
    };
  }

  const securitySchemes: YamlObject = {};
  for (const scheme of project.securitySchemes) {
    securitySchemes[scheme.name] = securitySchemeToOpenApi(scheme);
  }

  const components: YamlObject = {};
  if (Object.keys(schemas).length) components.schemas = schemas;
  if (Object.keys(securitySchemes).length) {
    components.securitySchemes = securitySchemes;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: `${project.name} API`,
      description: project.description || undefined,
      version: project.version || "1.0.0",
    },
    servers: project.baseUrl ? [{ url: project.baseUrl }] : undefined,
    paths,
    components: Object.keys(components).length ? components : undefined,
  };
}

export function generateOpenApiYaml(
  project: Project,
  endpoints: ApiEndpoint[],
): string {
  return toYaml(buildOpenApiDocument(project, endpoints));
}
