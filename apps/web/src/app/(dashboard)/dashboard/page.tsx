export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to KAGE - AI Cold Outreach Platform</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Prospects Researched", value: "0", change: "+0%" },
          { label: "Messages Generated", value: "0", change: "+0%" },
          { label: "Messages Approved", value: "0", change: "+0%" },
          { label: "Messages Sent", value: "0", change: "+0%" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Campaign Performance</h2>
          <p className="mt-2 text-gray-500">No campaigns yet</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="mt-2 text-gray-500">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
