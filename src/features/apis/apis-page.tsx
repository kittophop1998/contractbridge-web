"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiCreateDialog } from "@/features/apis/api-create-dialog";
import { MethodBadge } from "@/features/apis/method-badge";
import { formatDate } from "@/lib/format";
import { sortEndpoints } from "@/lib/schema";
import { useAsync } from "@/lib/use-async";
import { apiService } from "@/services";
import { HTTP_METHODS, type ApiEndpoint, type ApiEndpointInput } from "@/types";

const ALL_METHODS = "all";

export function ApisPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<string>(ALL_METHODS);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ApiEndpoint>();

  const { data, error, loading, reload } = useAsync(
    () => apiService.list(projectId),
    [projectId],
  );

  const endpoints = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortEndpoints(data ?? []).filter((api) => {
      const matchesMethod = method === ALL_METHODS || api.method === method;
      const matchesTerm =
        !term ||
        api.path.toLowerCase().includes(term) ||
        api.summary.toLowerCase().includes(term) ||
        api.operationId.toLowerCase().includes(term);
      return matchesMethod && matchesTerm;
    });
  }, [data, method, search]);

  async function createApi(input: ApiEndpointInput) {
    const created = await apiService.create(projectId, input);
    router.push(`/projects/${projectId}/apis/${created.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="APIs"
        description="Endpoints defined for this project. These drive both exports."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon aria-hidden />
            Add API
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search path, summary or operationId"
            aria-label="Search APIs"
            className="pl-8"
          />
        </div>
        <Select value={method} onValueChange={(value) => setMethod(String(value))}>
          <SelectTrigger aria-label="Filter by method" className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_METHODS}>All methods</SelectItem>
            {HTTP_METHODS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingState /> : null}

      {!loading && error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : null}

      {!loading && !error && endpoints.length === 0 ? (
        <EmptyState
          title={data?.length ? "No matching APIs" : "No APIs yet"}
          description={
            data?.length
              ? "Adjust the search term or method filter."
              : "Add the first endpoint for this project."
          }
          action={
            data?.length ? undefined : (
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon aria-hidden />
                Add API
              </Button>
            )
          }
        />
      ) : null}

      {!loading && !error && endpoints.length > 0 ? (
        <ul className="divide-y overflow-hidden rounded-md border bg-card shadow-[0_2px_12px_rgb(44_62_80_/_0.06)]">
          {endpoints.map((api) => (
            <li
              key={api.id}
              className="flex items-center gap-2 pr-2 transition-colors hover:bg-secondary/70"
            >
              <Link
                href={`/projects/${projectId}/apis/${api.id}`}
                className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <MethodBadge method={api.method} />
                  <span className="truncate font-mono text-sm">{api.path}</span>
                </div>
                <span className="truncate text-sm text-muted-foreground sm:ml-2 sm:flex-1">
                  {api.summary}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(api.updatedAt)}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${api.method} ${api.path}`}
                onClick={() => setDeleting(api)}
              >
                <Trash2Icon aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <ApiCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={createApi}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete API"
        description={
          <>
            <strong className="font-mono">
              {deleting?.method} {deleting?.path}
            </strong>{" "}
            will be removed from this project&apos;s contract.
          </>
        }
        onConfirm={async () => {
          if (!deleting) return;
          await apiService.remove(projectId, deleting.id);
          setDeleting(undefined);
          reload();
        }}
      />
    </div>
  );
}
