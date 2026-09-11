import { generateApiSpecMarkdown } from "@/lib/api-spec";
import { notFound } from "@/lib/errors";
import { generateOpenApiYaml } from "@/lib/openapi";
import { clone, db, delay } from "@/mocks/store";
import type { ExportService } from "@/services/export.service";
import type { ApiEndpoint, Project } from "@/types";

function load(projectId: string): { project: Project; apis: ApiEndpoint[] } {
  const project = db.projects.find((item) => item.id === projectId);
  if (!project) throw notFound("PROJECT_NOT_FOUND", "Project not found");
  return {
    project: clone(project),
    apis: clone(db.apis.filter((api) => api.projectId === projectId)),
  };
}

export const exportMockService: ExportService = {
  async generateOpenApi(projectId) {
    await delay();
    const { project, apis } = load(projectId);
    return {
      format: "openapi",
      filename: "openapi.yaml",
      language: "yaml",
      content: generateOpenApiYaml(project, apis),
    };
  },

  async generateApiSpec(projectId) {
    await delay();
    const { project, apis } = load(projectId);
    return {
      format: "api-spec",
      filename: "api-spec.md",
      language: "markdown",
      content: generateApiSpecMarkdown(project, apis),
    };
  },
};
