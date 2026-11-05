import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Megaphone,
  Plug,
  Search,
  ScrollText,
  Send,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Pipeline metrics and recent activity",
      },
      {
        label: "Prospects",
        href: "/prospects",
        icon: Users,
        description: "People and accounts you are targeting",
      },
      {
        label: "Companies",
        href: "/companies",
        icon: Building2,
        description: "Accounts grouped from your prospect list",
      },
      {
        label: "Campaigns",
        href: "/campaigns",
        icon: Megaphone,
        description: "Grouped outreach motions",
      },
      {
        label: "Outreach",
        href: "/outreach",
        icon: Send,
        description: "Review and approve drafted messages",
      },
      {
        label: "Research",
        href: "/research",
        icon: Search,
        description: "AI research reports per account",
      },
      {
        label: "Templates",
        href: "/templates",
        icon: FileText,
        description: "Reusable email and LinkedIn copy",
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        label: "Integrations",
        href: "/integrations",
        icon: Plug,
        description: "Connect Gmail and other channels",
      },
      {
        label: "Team",
        href: "/team",
        icon: UsersRound,
        description: "Members, roles and teams",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Organization profile and preferences",
      },
      {
        label: "Billing",
        href: "/billing",
        icon: CreditCard,
        description: "Plan, usage and invoices",
      },
      {
        label: "Audit log",
        href: "/audit",
        icon: ScrollText,
        description: "Every action taken in the workspace",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

/** Human label for a pathname segment, used by breadcrumbs and the command menu. */
export function labelForPath(pathname: string): string {
  const item = ALL_NAV_ITEMS.find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`)
  );
  if (item) return item.label;

  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
