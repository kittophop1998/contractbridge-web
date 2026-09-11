import Link from "next/link";
import { BracesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_MODE } from "@/services/config";

export function TopBar() {
  return (
    <header className="sticky top-0 z-[100] border-b border-white/10 bg-primary/95 text-primary-foreground shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/projects"
          className="flex items-center gap-2.5 font-heading text-sm font-semibold tracking-tight transition-opacity hover:opacity-85"
        >
          <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-foreground shadow-sm">
            <BracesIcon className="size-4" aria-hidden />
          </span>
          ContractBridge
        </Link>
        <Badge variant="outline" className="border-white/20 bg-white/5 font-mono text-[0.7rem] text-white">
          {API_MODE === "mock" ? "mock data" : "live api"}
        </Badge>
      </div>
    </header>
  );
}
