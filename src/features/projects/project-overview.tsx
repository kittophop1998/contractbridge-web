"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, DownloadIcon, PencilIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MethodBadge } from "@/features/apis/method-badge";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { formatDate } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { projectService, apiService } from "@/services";
import type { ProjectInput } from "@/types";

export function ProjectOverview({ projectId }: { projectId: string }) {
  const [editOpen, setEditOpen] = useState(false);

  const { data, error, loading, reload } = useAsync(
    async () => ({
      project: await projectService.getById(projectId),
      apis: await apiService.list(projectId),
    }),
    [projectId],
  );

  if (loading) return <LoadingState rows={2} />;
  if (error || !data) {
    return <ErrorState message={error?.message} onRetry={reload} />;
  }

  const { project, apis } = data;
  const recent = [...apis]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const facts = [
    { label: "APIs", value: String(project.apiCount) },
    { label: "Shared schemas", value: String(project.schemas.length) },
    { label: "Version", value: project.version || "—" },
    { label: "Updated", value: formatDate(project.updatedAt) },
  ];

  async function saveProject(input: ProjectInput) {
    await projectService.update(projectId, input);
    reload();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={project.description || "No description."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilIcon aria-hidden />
              Edit project
            </Button>
            <Button render={<Link href={`/projects/${project.id}/apis`} />}>
              APIs
              <ArrowRightIcon aria-hidden />
            </Button>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map((fact) => (
          <Card key={fact.label}>
            <CardContent className="space-y-1">
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="font-heading text-lg font-medium tracking-tight">
                {fact.value}
              </dd>
            </CardContent>
          </Card>
        ))}
      </dl>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Base URL</p>
            <p className="font-mono text-sm break-all">
              {project.baseUrl || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Authentication</p>
            <p className="font-mono text-sm break-all">
              {project.securitySchemes.length
                ? project.securitySchemes.map((s) => s.name).join(", ")
                : "None"}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-medium tracking-tight">
            Recent APIs
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/projects/${project.id}/exports`} />}
            >
              <DownloadIcon aria-hidden />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/projects/${project.id}/apis`} />}
            >
              View all
            </Button>
          </div>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No APIs yet"
            description="Add the first endpoint to start building this contract."
            action={
              <Button render={<Link href={`/projects/${project.id}/apis`} />}>
                Go to APIs
              </Button>
            }
          />
        ) : (
          <ul className="divide-y rounded-xl border">
            {recent.map((api) => (
              <li key={api.id}>
                <Link
                  href={`/projects/${project.id}/apis/${api.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <MethodBadge method={api.method} />
                  <span className="font-mono text-sm break-all">{api.path}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(api.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSubmit={saveProject}
      />
    </div>
  );
}
