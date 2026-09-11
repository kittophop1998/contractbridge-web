"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { formatDate } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { projectService } from "@/services";
import type { Project, ProjectInput } from "@/types";

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project>();
  const [deleting, setDeleting] = useState<Project>();

  const { data, error, loading, reload } = useAsync(
    () => projectService.list(),
    [],
  );

  const projects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term),
    );
  }, [data, search]);

  async function submitProject(input: ProjectInput) {
    if (editing) await projectService.update(editing.id, input);
    else await projectService.create(input);
    reload();
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setFormOpen(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Every project owns its own APIs, schemas and generated contract files."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon aria-hidden />
            New Project
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects"
          aria-label="Search projects"
          className="pl-8"
        />
      </div>

      {loading ? <LoadingState /> : null}

      {!loading && error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : null}

      {!loading && !error && projects.length === 0 ? (
        <EmptyState
          title={data?.length ? "No matching projects" : "No projects yet"}
          description={
            data?.length
              ? "Try a different search term."
              : "Create a project to start defining its API contract."
          }
          action={
            data?.length ? undefined : (
              <Button onClick={openCreate}>
                <PlusIcon aria-hidden />
                New Project
              </Button>
            )
          }
        />
      ) : null}

      {!loading && !error && projects.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Card className="h-full transition-shadow hover:shadow-sm">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-heading font-medium tracking-tight hover:underline"
                    >
                      {project.name}
                    </Link>
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      {project.apiCount} API
                    </Badge>
                  </div>

                  <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {project.description || "No description."}
                  </p>

                  <div className="flex items-center justify-between gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(project.updatedAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${project.name}`}
                        onClick={() => openEdit(project)}
                      >
                        <PencilIcon aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${project.name}`}
                        onClick={() => setDeleting(project)}
                      >
                        <Trash2Icon aria-hidden />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editing}
        onSubmit={submitProject}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete project"
        description={
          <>
            <strong>{deleting?.name}</strong> and its {deleting?.apiCount} API
            definitions will be removed. This cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (!deleting) return;
          await projectService.remove(deleting.id);
          setDeleting(undefined);
          reload();
        }}
      />
    </div>
  );
}
