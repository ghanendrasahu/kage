export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 bg-gray-900 lg:block">
        <div className="flex h-16 items-center px-6">
          <span className="text-xl font-bold text-white">KAGE</span>
        </div>
        <nav className="mt-6 space-y-1 px-3">
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Prospects", href: "/prospects" },
            { label: "Companies", href: "/companies" },
            { label: "Campaigns", href: "/campaigns" },
            { label: "Outreach", href: "/outreach" },
            { label: "Research", href: "/research" },
            { label: "Integrations", href: "/integrations" },
            { label: "Team", href: "/team" },
            { label: "Settings", href: "/settings" },
            { label: "Billing", href: "/billing" },
            { label: "Audit Log", href: "/audit" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <span className="text-lg font-semibold text-gray-900">Dashboard</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">user@example.com</span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
