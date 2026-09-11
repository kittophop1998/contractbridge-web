import { notFound } from "@/lib/errors";
import { clone, db, delay, nextId, now } from "@/mocks/store";
import type { ProjectService } from "@/services/project.service";
import type { Project } from "@/types";

function find(id: string): Project {
  const project = db.projects.find((item) => item.id === id);
  if (!project) throw notFound("PROJECT_NOT_FOUND", "Project not found");
  return project;
}

/** `apiCount` is derived, never stored on the record itself. */
function withCount(project: Project): Project {
  return {
    ...clone(project),
    apiCount: db.apis.filter((api) => api.projectId === project.id).length,
  };
}

export const projectMockService: ProjectService = {
  async list() {
    await delay();
    return [...db.projects]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(withCount);
  },

  async getById(id) {
    await delay();
    return withCount(find(id));
  },

  async create(input) {
    await delay();
    const timestamp = now();
    const project: Project = {
      id: nextId("prj"),
      name: input.name,
      description: input.description,
      version: input.version || "1.0.0",
      baseUrl: input.baseUrl,
      securitySchemes: input.securitySchemes ?? [],
      schemas: input.schemas ?? [],
      apiCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.projects.push(project);
    return withCount(project);
  },

  async update(id, input) {
    await delay();
    const project = find(id);
    Object.assign(project, clone(input), { updatedAt: now() });
    return withCount(project);
  },

  async remove(id) {
    await delay();
    find(id);
    db.projects = db.projects.filter((project) => project.id !== id);
    db.apis = db.apis.filter((api) => api.projectId !== id);
  },
};
