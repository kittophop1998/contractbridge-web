import type { Project, ProjectInput } from "@/types";

export interface ProjectService {
  list(): Promise<Project[]>;
  getById(id: string): Promise<Project>;
  create(input: ProjectInput): Promise<Project>;
  update(id: string, input: Partial<ProjectInput>): Promise<Project>;
  remove(id: string): Promise<void>;
}
