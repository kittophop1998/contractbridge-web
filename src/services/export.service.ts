import type { ExportFile } from "@/types";

export interface ExportService {
  generateOpenApi(projectId: string): Promise<ExportFile>;
  generateApiSpec(projectId: string): Promise<ExportFile>;
}
