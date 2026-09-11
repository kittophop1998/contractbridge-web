import type { ApiService } from "@/services/api.service";
import { request } from "@/services/http/client";
import type { ApiEndpoint } from "@/types";

export const apiHttpService: ApiService = {
  list: (projectId) => request<ApiEndpoint[]>(`/projects/${projectId}/apis`),
  getById: (projectId, apiId) =>
    request<ApiEndpoint>(`/projects/${projectId}/apis/${apiId}`),
  create: (projectId, input) =>
    request<ApiEndpoint>(`/projects/${projectId}/apis`, {
      method: "POST",
      body: input,
    }),
  update: (projectId, apiId, input) =>
    request<ApiEndpoint>(`/projects/${projectId}/apis/${apiId}`, {
      method: "PUT",
      body: input,
    }),
  remove: (projectId, apiId) =>
    request<void>(`/projects/${projectId}/apis/${apiId}`, { method: "DELETE" }),
};
