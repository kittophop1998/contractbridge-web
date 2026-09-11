"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon, SaveIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MethodBadge } from "@/features/apis/method-badge";
import { toServiceError } from "@/lib/errors";
import { formatSchemaType } from "@/lib/schema";
import { useAsync } from "@/lib/use-async";
import { apiService, projectService } from "@/services";
import {
  HTTP_METHODS,
  type ApiEndpoint,
  type ApiEndpointInput,
  type ApiParameter,
  type ApiRequestBody,
  type ApiResponse,
  type ApiSchema,
  type HttpMethod,
  type Project,
} from "@/types";

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function SchemaView({ schema, level = 0 }: { schema?: ApiSchema; level?: number }) {
  if (!schema) return <p className="text-sm text-muted-foreground">No schema defined.</p>;
  if (schema.ref) {
    return <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{schema.ref}{schema.nullable ? " | null" : ""}</code>;
  }

  return (
    <div className={level ? "border-l pl-3" : ""}>
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-xs">{formatSchemaType(schema)}</code>
        {schema.nullable ? <Badge variant="outline">nullable</Badge> : null}
        {schema.enum?.length ? <span className="text-xs text-muted-foreground">enum: {schema.enum.join(", ")}</span> : null}
      </div>
      {schema.description ? <p className="mt-1 text-sm text-muted-foreground">{schema.description}</p> : null}
      {schema.type === "array" ? <div className="mt-2"><span className="text-xs text-muted-foreground">Items</span><SchemaView schema={schema.items} level={level + 1} /></div> : null}
      {schema.type === "object" && schema.properties?.length ? (
        <div className="mt-3 space-y-2">
          {schema.properties.map((property) => (
            <div key={property.name} className="rounded-md bg-muted/50 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2"><code className="text-xs">{property.name}</code><span className="text-xs text-muted-foreground">{formatSchemaType(property)}</span>{property.required ? <Badge variant="secondary">required</Badge> : <Badge variant="outline">optional</Badge>}</div>
              {property.description ? <p className="mt-1 text-xs text-muted-foreground">{property.description}</p> : null}
              {(property.type === "object" || property.type === "array") && !property.ref ? <div className="mt-2"><SchemaView schema={property} level={level + 1} /></div> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CodeSample({ value, language = "json" }: { value?: string; language?: string }) {
  if (!value) return <p className="text-sm text-muted-foreground">No example defined.</p>;
  return <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-5"><code data-language={language}>{value}</code></pre>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-3"><h2 className="font-medium">{title}</h2>{children}</section>;
}

function ParameterList({ parameters }: { parameters: ApiParameter[] }) {
  if (!parameters.length) return <p className="text-sm text-muted-foreground">None.</p>;
  return <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Name</th><th className="px-3 py-2 font-medium">In</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Required</th><th className="px-3 py-2 font-medium">Description</th></tr></thead><tbody className="divide-y">{parameters.map((parameter) => <tr key={parameter.id}><td className="px-3 py-2 font-mono text-xs">{parameter.name}</td><td className="px-3 py-2">{parameter.in}</td><td className="px-3 py-2 text-xs">{formatSchemaType(parameter.schema)}</td><td className="px-3 py-2">{parameter.required || parameter.in === "path" ? "Yes" : "No"}</td><td className="px-3 py-2 text-muted-foreground">{parameter.description || "—"}</td></tr>)}</tbody></table></div>;
}

export function ApiDetail({ projectId, apiId }: { projectId: string; apiId: string }) {
  const [editing, setEditing] = useState(false);
  const { data, error, loading, reload } = useAsync(async () => ({ project: await projectService.getById(projectId), endpoint: await apiService.getById(projectId, apiId) }), [projectId, apiId]);

  if (loading) return <LoadingState rows={3} />;
  if (error || !data) return <ErrorState message={error?.message} onRetry={reload} />;
  const { project, endpoint } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3"><MethodBadge method={endpoint.method} className="h-6 w-[4.5rem]" /> <span className="font-mono text-xl">{endpoint.path}</span></span>}
        description={endpoint.summary || "API endpoint definition"}
        actions={<><Button variant="outline" render={<Link href={`/projects/${projectId}/apis`} />}><ArrowLeftIcon aria-hidden /> APIs</Button><Button onClick={() => setEditing(true)}><PencilIcon aria-hidden /> Edit API</Button></>}
      />

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="border-b"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="request">Request</TabsTrigger><TabsTrigger value="responses">Responses</TabsTrigger></TabsList>
        <TabsContent value="overview" className="pt-5"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-6"><Section title="Description"><p className="text-sm leading-6 text-muted-foreground">{endpoint.description || "No description defined."}</p></Section><Section title="Parameters"><ParameterList parameters={endpoint.parameters} /></Section><Section title="Response summary"><div className="grid gap-3 sm:grid-cols-2">{endpoint.responses.map((response) => <Card key={response.id}><CardContent className="space-y-1"><p className="font-mono text-sm">{response.status}</p><p className="text-sm text-muted-foreground">{response.description}</p></CardContent></Card>)}</div></Section></div><Card className="h-fit"><CardContent className="space-y-4 text-sm"><div><p className="text-xs text-muted-foreground">Operation ID</p><code>{endpoint.operationId || "—"}</code></div><div><p className="text-xs text-muted-foreground">Tags</p><div className="mt-1 flex flex-wrap gap-1">{endpoint.tags.length ? endpoint.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>) : "—"}</div></div><div><p className="text-xs text-muted-foreground">Authentication</p><p className="mt-1">{endpoint.security.length ? endpoint.security.join(", ") : "Public"}</p></div><div><p className="text-xs text-muted-foreground">Project schemas</p><p className="mt-1">{project.schemas.length} reusable schemas</p></div></CardContent></Card></div></TabsContent>
        <TabsContent value="request" className="space-y-6 pt-5"><Section title="Request body">{endpoint.requestBody ? <Card><CardContent className="space-y-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><span>{endpoint.requestBody.contentType}</span><Badge variant={endpoint.requestBody.required ? "secondary" : "outline"}>{endpoint.requestBody.required ? "required" : "optional"}</Badge></div><p className="text-sm text-muted-foreground">{endpoint.requestBody.description || "No description defined."}</p><SchemaView schema={endpoint.requestBody.schema} /><div><p className="mb-2 text-sm font-medium">Example request</p><CodeSample value={endpoint.requestBody.example} /></div></CardContent></Card> : <p className="text-sm text-muted-foreground">This endpoint has no request body.</p>}</Section></TabsContent>
        <TabsContent value="responses" className="space-y-4 pt-5">{endpoint.responses.map((response) => <Card key={response.id}><CardContent className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-mono font-medium">{response.status}</h2><p className="text-sm text-muted-foreground">{response.description}</p></div>{response.contentType ? <Badge variant="outline">{response.contentType}</Badge> : null}</div><SchemaView schema={response.schema} /><div><p className="mb-2 text-sm font-medium">Example response</p><CodeSample value={response.example} /></div></CardContent></Card>)}</TabsContent>
      </Tabs>

      <ApiEditorDialog open={editing} onOpenChange={setEditing} endpoint={endpoint} project={project} onSubmit={async (input) => { await apiService.update(projectId, apiId, input); setEditing(false); reload(); }} />
    </div>
  );
}

function ApiEditorDialog({ open, onOpenChange, endpoint, project, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; endpoint: ApiEndpoint; project: Project; onSubmit: (input: ApiEndpointInput) => Promise<void> }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><ApiEditorContent key={`${open}-${endpoint.id}`} endpoint={endpoint} project={project} onOpenChange={onOpenChange} onSubmit={onSubmit} /></Dialog>;
}

function ApiEditorContent({ endpoint, project, onOpenChange, onSubmit }: Omit<Parameters<typeof ApiEditorDialog>[0], "open">) {
  const [method, setMethod] = useState<HttpMethod>(endpoint.method);
  const [path, setPath] = useState(endpoint.path);
  const [operationId, setOperationId] = useState(endpoint.operationId);
  const [summary, setSummary] = useState(endpoint.summary);
  const [description, setDescription] = useState(endpoint.description ?? "");
  const [tags, setTags] = useState(endpoint.tags.join(", "));
  const [security, setSecurity] = useState(endpoint.security.join(", "));
  const [parameters, setParameters] = useState(pretty(endpoint.parameters));
  const [requestBody, setRequestBody] = useState(endpoint.requestBody ? pretty(endpoint.requestBody) : "");
  const [responses, setResponses] = useState(pretty(endpoint.responses));
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!path.trim().startsWith("/")) return setError("Path must start with a forward slash.");
    try {
      const input: ApiEndpointInput = { method, path: path.trim(), operationId: operationId.trim(), summary: summary.trim(), description: description.trim(), tags: splitList(tags), security: splitList(security), parameters: JSON.parse(parameters) as ApiParameter[], requestBody: requestBody.trim() ? JSON.parse(requestBody) as ApiRequestBody : undefined, responses: JSON.parse(responses) as ApiResponse[] };
      if (!Array.isArray(input.parameters) || !Array.isArray(input.responses)) throw new Error("Parameters and responses must each be JSON arrays.");
      setBusy(true); setError(undefined); await onSubmit(input);
    } catch (cause) { setError(toServiceError(cause).message); } finally { setBusy(false); }
  }

  return <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Edit API definition</DialogTitle><DialogDescription>Use typed JSON for parameters, bodies and responses. This preserves nested schemas, enum values, nullable fields and reusable schema refs.</DialogDescription></DialogHeader><form className="grid gap-5" onSubmit={save}><div className="grid gap-4 sm:grid-cols-[8rem_1fr]"><div className="grid gap-2"><Label htmlFor="edit-method">Method</Label><Select value={method} onValueChange={(value) => setMethod(value as HttpMethod)}><SelectTrigger id="edit-method"><SelectValue /></SelectTrigger><SelectContent>{HTTP_METHODS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="edit-path">Path</Label><Input id="edit-path" className="font-mono" value={path} onChange={(event) => setPath(event.target.value)} /></div></div><div className="grid gap-2"><Label htmlFor="edit-summary">Summary</Label><Input id="edit-summary" value={summary} onChange={(event) => setSummary(event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="edit-operation">Operation ID</Label><Input id="edit-operation" className="font-mono" value={operationId} onChange={(event) => setOperationId(event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="edit-tags">Tags</Label><Input id="edit-tags" value={tags} placeholder="Users, Admin" onChange={(event) => setTags(event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="edit-security">Security schemes</Label><Input id="edit-security" value={security} placeholder="bearerAuth" onChange={(event) => setSecurity(event.target.value)} /><p className="text-xs text-muted-foreground">Available: {project.securitySchemes.map((scheme) => scheme.name).join(", ") || "none"}</p></div></div><JsonField id="edit-parameters" label="Parameters" value={parameters} onChange={setParameters} /><JsonField id="edit-request" label="Request body (leave blank for none)" value={requestBody} onChange={setRequestBody} /><JsonField id="edit-responses" label="Responses" value={responses} onChange={setResponses} />{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={busy}><SaveIcon aria-hidden />{busy ? "Saving…" : "Save API"}</Button></DialogFooter></form></DialogContent>;
}

function JsonField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} className="min-h-44 font-mono text-xs leading-5" value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} /></div>;
}
