export default async function SurchargesPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL!;
  const res = await fetch(base + "/api/admin/pricing/surcharges", {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Surcharges</h1>
        <a href="/admin/pricing/surcharges/new" className="underline">
          Add new
        </a>
      </div>

      <div className="border rounded">
        {data.rows.map((r: any) => (
          <div
            key={r.id}
            className="p-4 border-b flex justify-between text-sm"
          >
            <span>{r.load_type}</span>
            <span>₹ {r.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
