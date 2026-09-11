import { ServiceError } from "@/lib/errors";
import { API_BASE_URL, API_MODE } from "@/services/config";

type Query = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

/**
 * Replaced with a real token/session lookup once auth exists. Returning
 * `undefined` keeps the header off the request.
 */
let authTokenProvider: () => string | undefined = () => undefined;

export function setAuthTokenProvider(provider: () => string | undefined): void {
  authTokenProvider = provider;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  if (!query) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}

function normalizeError(status: number, payload: unknown): ServiceError {
  const error =
    payload && typeof payload === "object"
      ? (payload as { error?: { code?: string; message?: string } }).error
      : undefined;
  return new ServiceError(
    error?.code ?? `HTTP_${status}`,
    error?.message ?? `Request failed with status ${status}`,
    status,
  );
}

export async function request<T>(
  path: string,
  { method = "GET", body, query, signal }: RequestOptions = {},
): Promise<T> {
  if (API_MODE === "mock") {
    // Guard rail: mock mode must never reach the network.
    throw new ServiceError(
      "HTTP_DISABLED",
      "HTTP client is disabled while NEXT_PUBLIC_API_MODE=mock",
    );
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...(authTokenProvider()
          ? { Authorization: `Bearer ${authTokenProvider()}` }
          : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ServiceError(
      "NETWORK_ERROR",
      cause instanceof Error ? cause.message : "Network request failed",
    );
  }

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : undefined;

  if (!response.ok) throw normalizeError(response.status, payload);
  return payload as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
