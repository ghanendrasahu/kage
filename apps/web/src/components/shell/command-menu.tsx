"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, FileText, Megaphone, Plus, Search, UserPlus, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { ALL_NAV_ITEMS } from "@/components/shell/nav-config";

interface Command {
  id: string;
  group: string;
  label: string;
  hint: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
}

const ACTIONS: Command[] = [
  {
    id: "new-campaign",
    group: "Quick actions",
    label: "New campaign",
    hint: "Group prospects into an outreach motion",
    href: "/campaigns?new=1",
    icon: Megaphone,
    keywords: "create launch",
  },
  {
    id: "new-prospect",
    group: "Quick actions",
    label: "Add prospect",
    hint: "Create a person and account record",
    href: "/prospects/new",
    icon: UserPlus,
    keywords: "create contact lead",
  },
  {
    id: "new-template",
    group: "Quick actions",
    label: "New template",
    hint: "Reusable email or LinkedIn copy",
    href: "/templates/new",
    icon: FileText,
    keywords: "create copy message",
  },
  {
    id: "new-team",
    group: "Quick actions",
    label: "Create team",
    hint: "Organise members around a book of business",
    href: "/team/new",
    icon: UsersRound,
    keywords: "create group members",
  },
];

const NAV_COMMANDS: Command[] = ALL_NAV_ITEMS.map((item) => ({
  id: `nav-${item.href}`,
  group: "Navigate",
  label: item.label,
  hint: item.description,
  href: item.href,
  icon: item.icon,
  keywords: item.description,
}));

const COMMANDS = [...ACTIONS, ...NAV_COMMANDS];

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return COMMANDS;
    return COMMANDS.filter((command) =>
      `${command.label} ${command.group} ${command.keywords ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector<HTMLElement>("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Array<{ command: Command; index: number }>>();
    results.forEach((command, index) => {
      const bucket = map.get(command.group) ?? [];
      bucket.push({ command, index });
      map.set(command.group, bucket);
    });
    return Array.from(map.entries());
  }, [results]);

  function run(index: number) {
    const command = results[index];
    if (!command) return;
    onOpenChange(false);
    router.push(command.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length ? (index - 1 + results.length) % results.length : 0
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-elevated shadow-pop animate-rise"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions…"
            className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
            aria-label="Search commands"
            autoComplete="off"
          />
          <kbd className="hidden rounded border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] text-subtle sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[360px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm text-muted">No matches for “{query}”</p>
              <p className="mt-1 text-xs text-subtle">Try a page name or an action.</p>
            </div>
          ) : (
            grouped.map(([group, entries]) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  {group}
                </p>
                {entries.map(({ command, index }) => {
                  const Icon = command.icon;
                  const active = index === activeIndex;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      data-active={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => run(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                        active ? "bg-hover" : "hover:bg-hover/60"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-md border",
                          active
                            ? "border-brand/30 bg-brand-soft text-brand"
                            : "border-line bg-surface text-subtle"
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-foreground">
                          {command.label}
                        </span>
                        <span className="block truncate text-[11px] text-subtle">
                          {command.hint}
                        </span>
                      </span>
                      {active ? (
                        <CornerDownLeft className="size-3.5 shrink-0 text-subtle" />
                      ) : (
                        <ArrowRight className="size-3.5 shrink-0 text-transparent" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-subtle">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line-strong bg-surface px-1 font-mono">↑</kbd>
              <kbd className="rounded border border-line-strong bg-surface px-1 font-mono">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line-strong bg-surface px-1 font-mono">↵</kbd>
              to open
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Plus className="size-3" />
            {results.length} results
          </span>
        </div>
      </div>
    </div>
  );
}
