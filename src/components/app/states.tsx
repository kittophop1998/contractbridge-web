import type { ReactNode } from "react";
import { AlertCircleIcon, InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Panel>
      <InboxIcon className="size-6 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </Panel>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Panel>
      <AlertCircleIcon className="size-6 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {message ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Panel>
  );
}
