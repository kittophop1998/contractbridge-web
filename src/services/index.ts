import { apiMockService } from "@/mocks/services/api.mock";
import { exportMockService } from "@/mocks/services/export.mock";
import { projectMockService } from "@/mocks/services/project.mock";
import { API_MODE } from "@/services/config";
import { apiHttpService } from "@/services/http/api.api";
import { exportHttpService } from "@/services/http/export.api";
import { projectHttpService } from "@/services/http/project.api";

/**
 * The one place mock and HTTP implementations are swapped. Everything above
 * this layer only ever sees the service contracts.
 */
const implementations =
  API_MODE === "mock"
    ? {
        project: projectMockService,
        api: apiMockService,
        export: exportMockService,
      }
    : {
        project: projectHttpService,
        api: apiHttpService,
        export: exportHttpService,
      };

export const projectService = implementations.project;
export const apiService = implementations.api;
export const exportService = implementations.export;

export type { ProjectService } from "@/services/project.service";
export type { ApiService } from "@/services/api.service";
export type { ExportService } from "@/services/export.service";
