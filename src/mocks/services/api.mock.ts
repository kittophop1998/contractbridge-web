import { notFound } from "@/lib/errors";
import { clone, db, delay, nextId, now } from "@/mocks/store";
import type { ApiService } from "@/services/api.service";
import type { ApiEndpoint } from "@/types";

function findProject(projectId: string): void {
  if (!db.projects.some((project) => project.id === projectId)) {
    throw notFound("PROJECT_NOT_FOUND", "Project not found");
  }
}

function find(projectId: string, apiId: string): ApiEndpoint {
  findProject(projectId);
  const api = db.apis.find(
    (item) => item.id === apiId && item.projectId === projectId,
  );
  if (!api) throw notFound("API_NOT_FOUND", "API endpoint not found");
  return api;
}

export const apiMockService: ApiService = {
  async list(projectId) {
    await delay();
    findProject(projectId);
    return clone(db.apis.filter((api) => api.projectId === projectId));
  },

  async getById(projectId, apiId) {
    await delay();
    return clone(find(projectId, apiId));
  },

  async create(projectId, input) {
    await delay();
    findProject(projectId);
    const timestamp = now();
    const api: ApiEndpoint = {
      ...clone(input),
      id: nextId("api"),
      projectId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.apis.push(api);
    touchProject(projectId);
    return clone(api);
  },

  async update(projectId, apiId, input) {
    await delay();
    const api = find(projectId, apiId);
    Object.assign(api, clone(input), { updatedAt: now() });
    touchProject(projectId);
    return clone(api);
  },

  async remove(projectId, apiId) {
    await delay();
    find(projectId, apiId);
    db.apis = db.apis.filter((api) => api.id !== apiId);
    touchProject(projectId);
  },
};

function touchProject(projectId: string): void {
  const project = db.projects.find((item) => item.id === projectId);
  if (project) project.updatedAt = now();
}
