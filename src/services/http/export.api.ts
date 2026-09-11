import type { ExportService } from "@/services/export.service";
import { request } from "@/services/http/client";
import type { ExportFile } from "@/types";

export const exportHttpService: ExportService = {
  generateOpenApi: (projectId) =>
    request<ExportFile>(`/projects/${projectId}/exports/openapi`),
  generateApiSpec: (projectId) =>
    request<ExportFile>(`/projects/${projectId}/exports/api-spec`),
};
