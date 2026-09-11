import { formatSchemaType, parseExample, sortEndpoints } from "@/lib/schema";
import type {
  ApiEndpoint,
  ApiParameter,
  ApiSchema,
  Project,
  SecurityScheme,
} from "@/types";

interface FieldRow {
  field: string;
  type: string;
  required: string;
  description: string;
}

function escapeCell(value: string | undefined): string {
  return (value ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim() || "—";
}

function table(headers: string[], rows: string[][]): string {
  if (!rows.length) return "_None_";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

/** Flattens an object/array schema into dotted rows for a Markdown table. */
function fieldRows(schema: ApiSchema, prefix = ""): FieldRow[] {
  if (schema.ref) return [];

  if (schema.type === "array") {
    const items = schema.items ?? { type: "string" };
    return fieldRows(items, `${prefix}[]`);
  }

  if (schema.type !== "object") return [];

  return (schema.properties ?? []).flatMap((property) => {
    const name = prefix ? `${prefix}.${property.name}` : property.name;
    const enums = property.enum?.length
      ? ` Allowed: ${property.enum.join(", ")}.`
      : "";
    const row: FieldRow = {
      field: name,
      type: formatSchemaType(property),
      required: property.required ? "required" : "optional",
      description: `${property.description ?? ""}${enums}`,
    };
    return [row, ...fieldRows(property, name)];
  });
}

function fieldTable(schema: ApiSchema | undefined): string {
  if (!schema) return "_None_";
  if (schema.ref) {
    return `Schema: [\`${schema.ref}\`](#${anchor(schema.ref)})`;
  }
  const rows = fieldRows(schema);
  if (!rows.length) {
    return `Type: \`${formatSchemaType(schema)}\``;
  }
  return table(
    ["Field", "Type", "Required", "Description"],
    rows.map((row) => [
      `\`${row.field}\``,
      `\`${row.type}\``,
      row.required,
      escapeCell(row.description),
    ]),
  );
}

function parameterTable(parameters: ApiParameter[]): string {
  return table(
    ["Name", "Type", "Required", "Description", "Example"],
    parameters.map((parameter) => [
      `\`${parameter.name}\``,
      `\`${formatSchemaType(parameter.schema)}\``,
      parameter.in === "path" || parameter.required ? "required" : "optional",
      escapeCell(parameter.description),
      parameter.example ? `\`${escapeCell(parameter.example)}\`` : "—",
    ]),
  );
}

function codeBlock(content: string, language = "json"): string {
  return ["```" + language, content.trim(), "```"].join("\n");
}

function anchor(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function describeScheme(scheme: SecurityScheme): string {
  if (scheme.type === "apiKey") {
    return `API key sent in the \`${scheme.paramName ?? scheme.name}\` ${scheme.in ?? "header"}.`;
  }
  if (scheme.scheme === "basic") return "HTTP Basic credentials.";
  return `\`Authorization: Bearer <token>\`${
    scheme.bearerFormat ? ` (${scheme.bearerFormat})` : ""
  }.`;
}

/** Error codes are derived from the `code` field of documented error examples. */
function collectErrorCodes(endpoints: ApiEndpoint[]): [string, string][] {
  const codes = new Map<string, string>();
  for (const endpoint of endpoints) {
    for (const response of endpoint.responses) {
      if (response.status < 400) continue;
      const example = parseExample(response.example);
      const code = readErrorCode(example);
      if (code && !codes.has(code)) {
        codes.set(code, `${response.status} — ${response.description}`);
      }
    }
  }
  return [...codes.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function readErrorCode(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.code === "string") return record.code;
  return readErrorCode(record.error);
}

function renderEndpoint(endpoint: ApiEndpoint): string {
  const lines: string[] = [`### ${endpoint.method} ${endpoint.path}`, ""];

  if (endpoint.summary) lines.push(`**${endpoint.summary}**`, "");
  lines.push(`- Description: ${endpoint.description || endpoint.summary || "—"}`);
  lines.push(
    `- Auth: ${endpoint.security.length ? endpoint.security.join(", ") : "None (public)"}`,
  );
  if (endpoint.operationId) {
    lines.push(`- Operation ID: \`${endpoint.operationId}\``);
  }
  if (endpoint.tags.length) lines.push(`- Tags: ${endpoint.tags.join(", ")}`);
  lines.push("");

  for (const [label, location] of [
    ["Path Parameters", "path"],
    ["Query Parameters", "query"],
    ["Header Parameters", "header"],
  ] as const) {
    const parameters = endpoint.parameters.filter(
      (parameter) => parameter.in === location,
    );
    if (!parameters.length) continue;
    lines.push(`#### ${label}`, "", parameterTable(parameters), "");
  }

  lines.push("#### Request Body", "");
  if (endpoint.requestBody) {
    const { contentType, required, description, schema, example } =
      endpoint.requestBody;
    lines.push(
      `Content-Type: \`${contentType || "application/json"}\` · ${
        required ? "required" : "optional"
      }`,
      "",
    );
    if (description) lines.push(description, "");
    lines.push(fieldTable(schema), "");
    if (example) lines.push("Example:", "", codeBlock(example), "");
  } else {
    lines.push("_None_", "");
  }

  lines.push("#### Responses", "");
  for (const response of [...endpoint.responses].sort(
    (a, b) => a.status - b.status,
  )) {
    lines.push(`##### ${response.status}`, "", response.description, "");
    if (response.schema) {
      lines.push(
        `Content-Type: \`${response.contentType || "application/json"}\``,
        "",
        fieldTable(response.schema),
        "",
      );
    }
    if (response.example) {
      lines.push("Example:", "", codeBlock(response.example), "");
    }
  }

  return lines.join("\n");
}

export function generateApiSpecMarkdown(
  project: Project,
  endpoints: ApiEndpoint[],
): string {
  const sorted = sortEndpoints(endpoints);
  const lines: string[] = [`# ${project.name} API Specification`, ""];

  lines.push("## Overview", "");
  lines.push(project.description || "_No description provided._", "");
  lines.push(
    table(
      ["Property", "Value"],
      [
        ["Version", `\`${project.version || "1.0.0"}\``],
        ["Endpoints", String(sorted.length)],
        ["Shared schemas", String(project.schemas.length)],
        ["Generated", "from ContractBridge project data"],
      ],
    ),
    "",
  );

  lines.push("## Base URL", "", codeBlock(project.baseUrl || "—", "text"), "");

  lines.push("## Authentication", "");
  if (project.securitySchemes.length) {
    for (const scheme of project.securitySchemes) {
      lines.push(
        `- **${scheme.name}** — ${describeScheme(scheme)}${
          scheme.description ? ` ${scheme.description}` : ""
        }`,
      );
    }
    lines.push(
      "",
      "Endpoints list their required scheme under `Auth:`. Endpoints marked `None (public)` need no credentials.",
      "",
    );
  } else {
    lines.push("No authentication is defined for this project.", "");
  }

  lines.push("## Common Error Format", "");
  lines.push(
    "Every error response uses the same envelope:",
    "",
    codeBlock(
      JSON.stringify(
        { error: { code: "RESOURCE_NOT_FOUND", message: "Resource not found" } },
        null,
        2,
      ),
    ),
    "",
  );

  lines.push("## Endpoints", "");
  if (!sorted.length) {
    lines.push("_No endpoints defined yet._", "");
  } else {
    lines.push(
      table(
        ["Method", "Path", "Summary"],
        sorted.map((endpoint) => [
          `\`${endpoint.method}\``,
          `\`${endpoint.path}\``,
          escapeCell(endpoint.summary),
        ]),
      ),
      "",
    );
    for (const endpoint of sorted) lines.push(renderEndpoint(endpoint), "");
  }

  lines.push("## Schemas", "");
  if (!project.schemas.length) {
    lines.push("_No shared schemas defined._", "");
  } else {
    for (const named of project.schemas) {
      lines.push(`### ${named.name}`, "");
      if (named.description) lines.push(named.description, "");
      lines.push(fieldTable(named.schema), "");
    }
  }

  lines.push("## Error Codes", "");
  const errorCodes = collectErrorCodes(sorted);
  if (!errorCodes.length) {
    lines.push("_No error codes documented._", "");
  } else {
    lines.push(
      table(
        ["Code", "Returned by"],
        errorCodes.map(([code, where]) => [`\`${code}\``, where]),
      ),
      "",
    );
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
