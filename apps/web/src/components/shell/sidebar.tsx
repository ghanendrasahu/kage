"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  CreditCard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/components/shell/nav-config";
import { Avatar } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { KageMark } from "@/components/ui/logo";

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Account";
  const userEmail = session?.user?.email ?? "Not signed in";
  const role = session?.user?.role ?? "MEMBER";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-surface",
        "transition-[width,transform] duration-200 ease-out lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-[72px]" : "lg:w-[264px]"
      )}
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4",
          collapsed && "lg:justify-center lg:px-0"
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none"
          onClick={onCloseMobile}
        >
          <KageMark />
          <span className={cn("flex flex-col leading-none", collapsed && "lg:hidden")}>
            <span className="text-[14px] font-semibold tracking-[0.16em] text-foreground">
              KAGE
            </span>
            <span className="mt-1 text-[9px] font-medium tracking-[0.14em] text-subtle">
              OUTREACH OS
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-auto rounded-lg p-1.5 text-subtle transition-colors hover:bg-hover hover:text-foreground lg:hidden"
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Sections */}
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label} className={cn(index > 0 && "mt-5")}>
            <p
              className={cn(
                "px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle",
                collapsed && "lg:hidden"
              )}
            >
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                        collapsed && "lg:justify-center lg:px-0",
                        active
                          ? "bg-hover text-foreground"
                          : "text-muted hover:bg-hover/60 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-brand transition-opacity",
                          active ? "opacity-100" : "opacity-0"
                        )}
                        aria-hidden
                      />
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          active ? "text-brand" : "text-subtle group-hover:text-muted"
                        )}
                      />
                      <span className={cn("truncate", collapsed && "lg:hidden")}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-line p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            "mb-1 hidden w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-subtle transition-colors hover:bg-hover hover:text-foreground lg:flex",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <Dropdown
          side="top"
          align="start"
          className="w-60"
          trigger={(triggerProps) => (
            <button
              type="button"
              {...triggerProps}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-line hover:bg-hover",
                collapsed && "lg:justify-center lg:px-0"
              )}
            >
              <Avatar name={userName} size="sm" />
              <span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
                <span className="block truncate text-[12px] font-medium text-foreground">
                  {userName}
                </span>
                <span className="block truncate text-[11px] text-subtle">{userEmail}</span>
              </span>
              <ChevronDown
                className={cn("size-3.5 shrink-0 text-subtle", collapsed && "lg:hidden")}
              />
            </button>
          )}
        >
          <DropdownLabel>
            {userEmail} · {role}
          </DropdownLabel>
          <DropdownSeparator />
          <Link href="/settings">
            <DropdownItem icon={<Settings />}>Settings</DropdownItem>
          </Link>
          <Link href="/billing">
            <DropdownItem icon={<CreditCard />}>Billing &amp; plan</DropdownItem>
          </Link>
          <DropdownSeparator />
          <DropdownItem icon={<LogOut />} danger onSelect={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </aside>
  );
}
