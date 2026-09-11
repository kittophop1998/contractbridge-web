import type { ApiEndpoint, ApiEndpointInput } from "@/types";

export interface ApiService {
  list(projectId: string): Promise<ApiEndpoint[]>;
  getById(projectId: string, apiId: string): Promise<ApiEndpoint>;
  create(projectId: string, input: ApiEndpointInput): Promise<ApiEndpoint>;
  update(
    projectId: string,
    apiId: string,
    input: ApiEndpointInput,
  ): Promise<ApiEndpoint>;
  remove(projectId: string, apiId: string): Promise<void>;
}
