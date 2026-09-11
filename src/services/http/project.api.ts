import type { ProjectService } from "@/services/project.service";
import { request } from "@/services/http/client";
import type { Project } from "@/types";

export const projectHttpService: ProjectService = {
  list: () => request<Project[]>("/projects"),
  getById: (id) => request<Project>(`/projects/${id}`),
  create: (input) => request<Project>("/projects", { method: "POST", body: input }),
  update: (id, input) =>
    request<Project>(`/projects/${id}`, { method: "PATCH", body: input }),
  remove: (id) => request<void>(`/projects/${id}`, { method: "DELETE" }),
};
