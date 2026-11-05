"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { labelForPath } from "@/components/shell/nav-config";

export function Topbar({
  onOpenCommand,
  onOpenMobileNav,
}: {
  onOpenCommand: () => void;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const current = labelForPath(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="hidden text-subtle sm:inline">Workspace</span>
          <ChevronRight className="hidden size-3.5 text-line-strong sm:inline" aria-hidden />
          <span className="truncate font-medium text-foreground">{current}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCommand}
            className={cn(
              "group hidden items-center gap-2 rounded-lg border border-line bg-elevated py-1.5 pl-2.5 pr-1.5 text-xs text-subtle transition-colors hover:border-line-strong hover:text-muted sm:flex"
            )}
            aria-label="Open command menu"
          >
            <Search className="size-3.5" />
            <span className="pr-6">Search or jump to…</span>
            <kbd className="rounded border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenCommand}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-foreground sm:hidden"
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>

          <Link
            href="/campaigns?new=1"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "hidden sm:inline-flex")}
          >
            <Plus />
            New campaign
          </Link>

          <button
            type="button"
            className="relative rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
