/** Minimal YAML serialiser — enough for the OpenAPI documents we emit. */

export type YamlValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | YamlValue[]
  | { [key: string]: YamlValue };

const INDENT = "  ";

const IMPLICIT_SCALAR =
  /^(|~|null|Null|NULL|true|True|TRUE|false|False|FALSE|yes|Yes|no|No|on|On|off|Off|-?\d+(\.\d+)?([eE][-+]?\d+)?)$/;

/** YAML 1.1 resolves bare timestamps to dates; keep them as strings. */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}([Tt ].*)?$/;

function needsQuotes(value: string): boolean {
  return (
    IMPLICIT_SCALAR.test(value) ||
    TIMESTAMP.test(value) ||
    /^\s|\s$/.test(value) ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
    /:(\s|$)|\s#/.test(value) ||
    /[\n\r\t]/.test(value)
  );
}

function scalar(value: string | number | boolean | null): string {
  if (value === null) return "null";
  if (typeof value !== "string") return String(value);
  return needsQuotes(value) ? JSON.stringify(value) : value;
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/** Multi-line strings are emitted as literal blocks when YAML allows it. */
function canUseBlock(value: string): boolean {
  return value.includes("\n") && !/^\s/.test(value) && !value.includes("\r");
}

function blockLines(value: string, level: number): string[] {
  return value
    .replace(/\s+$/, "")
    .split("\n")
    .map((line) => (line.length ? INDENT.repeat(level) + line : ""));
}

function emitEntry(prefix: string, value: YamlValue, level: number): string[] {
  const pad = INDENT.repeat(level);

  if (isScalar(value)) {
    if (typeof value === "string" && canUseBlock(value)) {
      return [`${pad}${prefix}|-`, ...blockLines(value, level + 1)];
    }
    return [`${pad}${prefix}${scalar(value)}`];
  }

  const nested = emit(value, level + 1);
  if (nested.length === 1 && (nested[0] === "{}" || nested[0] === "[]")) {
    return [`${pad}${prefix}${nested[0]}`];
  }
  // `key:` opens a block; `- ` shares its line with the first nested entry.
  if (prefix.endsWith(" ") && prefix.trimEnd().endsWith("-")) {
    return [
      `${pad}${prefix}${nested[0].slice((level + 1) * INDENT.length)}`,
      ...nested.slice(1),
    ];
  }
  return [`${pad}${prefix.trimEnd()}`, ...nested];
}

function emit(value: YamlValue, level: number): string[] {
  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== undefined);
    if (items.length === 0) return ["[]"];
    return items.flatMap((item) => emitEntry("- ", item, level));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return ["{}"];
    return entries.flatMap(([key, v]) => {
      const safeKey = needsQuotes(key) ? JSON.stringify(key) : key;
      return emitEntry(`${safeKey}: `, v, level);
    });
  }

  return [`${INDENT.repeat(level)}${scalar(value ?? null)}`];
}

export function toYaml(value: YamlValue): string {
  return `${emit(value, 0).join("\n")}\n`;
}
