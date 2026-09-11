import { seedApis } from "@/mocks/data/apis";
import { seedProjects } from "@/mocks/data/projects";
import type { ApiEndpoint, Project } from "@/types";

/**
 * In-memory store backing the mock services. It lives for the lifetime of the
 * page, so a refresh resets everything back to the seed data.
 */
const state = {
  projects: structuredClone(seedProjects) as Project[],
  apis: structuredClone(seedApis) as ApiEndpoint[],
};

const MOCK_LATENCY_MS = 140;

/** Mimics network latency so loading states behave like the real thing. */
export function delay(ms: number = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function nextId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function now(): string {
  return new Date().toISOString();
}

export const db = state;
