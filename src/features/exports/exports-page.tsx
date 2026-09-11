"use client";

import { useState } from "react";
import { DownloadIcon, FileCode2Icon, FileTextIcon, RefreshCwIcon } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAsync } from "@/lib/use-async";
import { exportService } from "@/services";
import type { ExportFile } from "@/types";

function download(file: ExportFile) {
  const blob = new Blob([file.content], { type: file.language === "yaml" ? "application/yaml;charset=utf-8" : "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ExportPreview({ file, title, description, icon }: { file: ExportFile; title: string; description: string; icon: "yaml" | "markdown" }) {
  const Icon = icon === "yaml" ? FileCode2Icon : FileTextIcon;
  return <Card><CardContent className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><Icon className="mt-0.5 size-5 text-muted-foreground" aria-hidden /><div><h2 className="font-medium">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div></div><div className="flex shrink-0 gap-2"><CopyButton value={file.content} /><Button variant="outline" size="sm" onClick={() => download(file)}><DownloadIcon aria-hidden /> Download</Button></div></div><pre className="max-h-[55vh] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-5"><code>{file.content}</code></pre></CardContent></Card>;
}

export function ExportsPage({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState("openapi");
  const { data, error, loading, reload } = useAsync(() => Promise.all([exportService.generateOpenApi(projectId), exportService.generateApiSpec(projectId)]), [projectId]);

  if (loading) return <LoadingState rows={2} />;
  if (error || !data) return <ErrorState message={error?.message} onRetry={reload} />;
  const [openapi, apiSpec] = data;

  return <div className="space-y-6"><PageHeader title="Export contract" description="Generated from this project's current endpoints, schemas, authentication and examples." actions={<Button variant="outline" onClick={reload}><RefreshCwIcon aria-hidden /> Refresh preview</Button>} /><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList variant="line" className="border-b"><TabsTrigger value="openapi">openapi.yaml</TabsTrigger><TabsTrigger value="api-spec">api-spec.md</TabsTrigger></TabsList><TabsContent value="openapi" className="pt-5"><ExportPreview file={openapi} title="OpenAPI 3.1" description="Machine-readable contract for tools, generators and backend validation." icon="yaml" /></TabsContent><TabsContent value="api-spec" className="pt-5"><ExportPreview file={apiSpec} title="API specification" description="Readable implementation contract for backend developers." icon="markdown" /></TabsContent></Tabs></div>;
}
