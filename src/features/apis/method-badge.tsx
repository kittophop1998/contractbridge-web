import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/types";

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-[#20b2aa]/15 text-[#087b75]",
  POST: "bg-[#2c3e50]/10 text-[#2c3e50]",
  PUT: "bg-[#ff8c00]/15 text-[#a85400]",
  PATCH: "bg-[#8a2be2]/12 text-[#6820ad]",
  DELETE: "bg-rose-500/10 text-rose-700",
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
        "inline-flex h-6 w-16 shrink-0 items-center justify-center rounded-sm font-mono text-[0.7rem] font-semibold tracking-tight",
        METHOD_STYLES[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
