

async function getMonitorData() {
  try {
    const res = await fetch("http://localhost:3001/monitor", {
      cache: "no-store",
      next: { revalidate: 3 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch monitor data");
    }

    return res.json();
  } catch (error) {
    console.error(error);

    return {
      totalKeys: 0,
      hits: 0,
      misses: 0,
      hitRate: "0%",
      evictionCount: 0,
      memoryEstimate: "0 bytes",
    };
  }
}

type StatCardProps = {
  title: string;
  value: string | number;
};

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="mt-2 text-3xl font-bold text-black">{value}</h2>
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getMonitorData();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-black">
            Fedis Cache Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Live monitoring for your distributed cache system
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Keys" value={data.totalKeys} />
          <StatCard title="Cache Hits" value={data.hits} />
          <StatCard title="Cache Misses" value={data.misses} />
          <StatCard title="Hit Rate" value={data.hitRate} />
          <StatCard title="Eviction Count" value={data.evictionCount} />
          <StatCard title="Memory Estimate" value={data.memoryEstimate} />
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-black">
            Monitor Endpoint Status
          </h2>

          <p className="mt-3 text-gray-600">
            This dashboard is connected to your backend cache server and is
            fetching live monitoring statistics from the /monitor endpoint.
          </p>

          <p className="mt-3 text-sm text-gray-500">
            Backend URL: http://localhost:3001/monitor
          </p>
        </div>
      </div>
    </main>
  );
}
