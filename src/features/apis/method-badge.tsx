import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/types";

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  POST: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  PUT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PATCH: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  DELETE: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  HEAD: "bg-muted text-muted-foreground",
  OPTIONS: "bg-muted text-muted-foreground",
};

export function MethodBadge({
  method,
  className,
}: {
  method: HttpMethod;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-16 shrink-0 items-center justify-center rounded-md font-mono text-[0.7rem] font-semibold tracking-tight",
        METHOD_STYLES[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
