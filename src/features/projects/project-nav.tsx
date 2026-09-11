"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";
import { projectService } from "@/services";

const SECTIONS = [
  { href: "", label: "Overview" },
  { href: "/apis", label: "APIs" },
  { href: "/exports", label: "Export" },
] as const;

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: projects, loading } = useAsync(
    () => projectService.list(),
    [],
  );

  const base = `/projects/${projectId}`;
  const rest = pathname.slice(base.length);
  const section = rest.startsWith("/exports")
    ? "/exports"
    : rest.startsWith("/apis")
      ? "/apis"
      : "";

  return (
    <nav className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link
          href="/projects"
          className="text-muted-foreground hover:text-foreground"
        >
          Projects
        </Link>
        <ChevronRightIcon
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        {loading || !projects ? (
          <Skeleton className="h-8 w-40" />
        ) : (
          <Select
            value={projectId}
            onValueChange={(value) =>
              router.push(`/projects/${String(value)}${section}`)
            }
          >
            <SelectTrigger aria-label="Switch project" className="max-w-56">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {SECTIONS.map((item) => {
          const href = `${base}${item.href}`;
          const active = section === item.href;
          return (
            <Link
              key={item.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
