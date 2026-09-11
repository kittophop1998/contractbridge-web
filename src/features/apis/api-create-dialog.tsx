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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toServiceError } from "@/lib/errors";
import { pathParamNames, suggestOperationId } from "@/lib/schema";
import { HTTP_METHODS, type ApiEndpointInput, type HttpMethod } from "@/types";

/** A new endpoint starts with its path params and a 200 response filled in. */
export function buildEndpointDraft(
  method: HttpMethod,
  path: string,
  summary: string,
): ApiEndpointInput {
  return {
    method,
    path,
    operationId: suggestOperationId(method, path),
    summary,
    description: "",
    tags: [],
    security: [],
    parameters: pathParamNames(path).map((name, index) => ({
      id: `prm_${index}_${name}`,
      name,
      in: "path",
      required: true,
      schema: { type: "string" },
    })),
    responses: [
      {
        id: "res_200",
        status: 200,
        description: "Successful response",
        contentType: "application/json",
        schema: { type: "object", properties: [] },
      },
    ],
  };
}

export function ApiCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ApiEndpointInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ApiCreateContent
        key={String(open)}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

function ApiCreateContent({
  onOpenChange,
  onSubmit,
}: {
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ApiEndpointInput) => Promise<void>;
}) {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState("/api/v1/");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = path.trim();
    if (!trimmed.startsWith("/")) {
      setError("Path must start with a forward slash.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await onSubmit(buildEndpointDraft(method, trimmed, summary.trim()));
      onOpenChange(false);
    } catch (cause) {
      setError(toServiceError(cause).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add API</DialogTitle>
          <DialogDescription>
            Define the method and path now; parameters, body and responses are
            edited on the detail screen.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="api-method">Method</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as HttpMethod)}
              >
                <SelectTrigger id="api-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-path">Path</Label>
              <Input
                id="api-path"
                value={path}
                onChange={(event) => setPath(event.target.value)}
                placeholder="/api/v1/users/{id}"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api-summary">Summary</Label>
            <Input
              id="api-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="List users"
            />
          </div>

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
              {busy ? "Creating…" : "Create API"}
            </Button>
          </DialogFooter>
        </form>
    </DialogContent>
  );
}
