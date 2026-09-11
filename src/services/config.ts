export type ApiMode = "mock" | "api";

/**
 * The single place that decides whether the app talks to in-memory mocks or a
 * real backend. Components and features never branch on this.
 */
export const API_MODE: ApiMode =
  process.env.NEXT_PUBLIC_API_MODE === "api" ? "api" : "mock";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";
