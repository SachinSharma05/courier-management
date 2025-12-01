import Link from "next/link";

export default async function DistanceSlabsPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL!;
  const res = await fetch(base + "/api/dtdc/settings/distance-slabs", {
    cache: "no-store",
  });
  const data = await res.json();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Distance Slabs</h1>
        <Link
          href="/admin/dtdc/settings/distance-slabs/new"
          className="px-4 py-2 bg-black text-white rounded"
        >
          + Add New
        </Link>
      </div>

      <div className="border rounded-md bg-white">
        {data.rows.map((r: any) => (
          <div
            key={r.id}
            className="p-4 border-b flex justify-between items-center text-sm"
          >
            <div>
              <div className="font-medium">
                {r.min_km} – {r.max_km} km
              </div>
              <div className="text-gray-500">₹ {r.price}</div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href={`/admin/dtdc/settings/distance-slabs/${r.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                Edit
              </Link>

              <DeleteButton id={r.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import DeleteButton from "./DeleteButton";
