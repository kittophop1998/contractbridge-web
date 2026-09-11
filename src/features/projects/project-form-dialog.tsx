"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toServiceError } from "@/lib/errors";
import type { NamedSchema, Project, ProjectInput, SecurityScheme } from "@/types";

const EMPTY: ProjectInput = {
  name: "",
  description: "",
  version: "1.0.0",
  baseUrl: "https://api.example.com/api/v1",
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; omitted when creating. */
  project?: Project;
  onSubmit: (input: ProjectInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ProjectFormContent
        key={`${open}-${project?.id ?? "new"}`}
        project={project}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

function ProjectFormContent({
  project,
  onOpenChange,
  onSubmit,
}: {
  project?: Project;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ProjectInput) => Promise<void>;
}) {
  const [values, setValues] = useState<ProjectInput>(() =>
    project
      ? {
          name: project.name,
          description: project.description,
          version: project.version,
          baseUrl: project.baseUrl,
        }
      : EMPTY,
  );
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [securitySchemes, setSecuritySchemes] = useState(() =>
    JSON.stringify(project?.securitySchemes ?? [], null, 2),
  );
  const [schemas, setSchemas] = useState(() =>
    JSON.stringify(project?.schemas ?? [], null, 2),
  );

  function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Project name is required.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const parsedSecuritySchemes = JSON.parse(securitySchemes) as unknown;
      const parsedSchemas = JSON.parse(schemas) as unknown;
      if (!Array.isArray(parsedSecuritySchemes) || !Array.isArray(parsedSchemas)) {
        throw new Error("Security schemes and reusable schemas must each be JSON arrays.");
      }
      await onSubmit({
        ...values,
        name: values.name.trim(),
        securitySchemes: parsedSecuritySchemes as SecurityScheme[],
        schemas: parsedSchemas as NamedSchema[],
      });
      onOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof SyntaxError
          ? "Security schemes and reusable schemas must each be valid JSON arrays."
          : toServiceError(cause).message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            Projects keep their APIs, schemas and exports isolated from each
            other.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={values.name}
              placeholder="billing-api"
              onChange={(event) => set("name", event.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={values.description}
              placeholder="What this API covers and who consumes it."
              onChange={(event) => set("description", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="project-version">Version</Label>
              <Input
                id="project-version"
                value={values.version}
                placeholder="1.0.0"
                onChange={(event) => set("version", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-base-url">Base URL</Label>
              <Input
                id="project-base-url"
                value={values.baseUrl}
                placeholder="https://api.example.com/api/v1"
                onChange={(event) => set("baseUrl", event.target.value)}
              />
            </div>
          </div>

          <section className="grid gap-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Contract settings</p>
              <p className="text-xs text-muted-foreground">
                Optional reusable schemas and security schemes available to this
                project&apos;s APIs.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-security">Security schemes</Label>
              <Textarea
                id="project-security"
                className="min-h-32 font-mono text-xs leading-5"
                value={securitySchemes}
                onChange={(event) => setSecuritySchemes(event.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-schemas">Reusable schemas</Label>
              <Textarea
                id="project-schemas"
                className="min-h-40 font-mono text-xs leading-5"
                value={schemas}
                onChange={(event) => setSchemas(event.target.value)}
                spellCheck={false}
              />
            </div>
          </section>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
    </DialogContent>
  );
}
