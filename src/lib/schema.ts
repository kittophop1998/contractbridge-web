import type {
  ApiEndpoint,
  ApiSchema,
  ApiSchemaProperty,
  HttpMethod,
  SchemaType,
} from "@/types";

export function createSchema(type: SchemaType = "string"): ApiSchema {
  if (type === "object") return { type, properties: [] };
  if (type === "array") return { type, items: { type: "string" } };
  return { type };
}

export function createProperty(name = ""): ApiSchemaProperty {
  return { name, required: false, type: "string" };
}

/** Human label used by the schema editor and the Markdown exporter. */
export function formatSchemaType(schema: ApiSchema | undefined): string {
  if (!schema) return "—";
  if (schema.ref) return schema.ref + (schema.nullable ? " | null" : "");
  const base =
    schema.type === "array"
      ? `array<${formatSchemaType(schema.items)}>`
      : schema.type;
  const parts = [schema.format ? `${base} (${schema.format})` : base];
  if (schema.nullable) parts.push("nullable");
  return parts.join(" · ");
}

/** Example text is authored as free text but exported as JSON when it parses. */
export function parseExample(example: string | undefined): unknown {
  if (!example) return undefined;
  const trimmed = example.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

/** Enum members are authored as strings; export them using the schema type. */
export function coerceEnum(schema: ApiSchema): (string | number | boolean)[] {
  return (schema.enum ?? []).map((value) => {
    if (schema.type === "number" || schema.type === "integer") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    if (schema.type === "boolean") return value === "true";
    return value;
  });
}

/** `/projects/{projectId}/apis` -> `["projectId"]` */
export function pathParamNames(path: string): string[] {
  return Array.from(path.matchAll(/{([^}]+)}/g), (match) => match[1]);
}

export function suggestOperationId(method: HttpMethod, path: string): string {
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith("{")
        ? `By${capitalize(segment.slice(1, -1))}`
        : capitalize(segment.replace(/[^a-zA-Z0-9]/g, "")),
    );
  return method.toLowerCase() + segments.join("");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function sortEndpoints(endpoints: ApiEndpoint[]): ApiEndpoint[] {
  return [...endpoints].sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
  );
}
