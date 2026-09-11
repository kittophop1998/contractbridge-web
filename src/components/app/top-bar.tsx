import Link from "next/link";
import { WaypointsIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_MODE } from "@/services/config";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/projects"
          className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight"
        >
          <WaypointsIcon className="size-4 text-muted-foreground" aria-hidden />
          ContractBridge
        </Link>
        <Badge variant="outline" className="font-mono text-[0.7rem]">
          {API_MODE === "mock" ? "mock data" : "live api"}
        </Badge>
      </div>
    </header>
  );
}
