export default async function WeightSlabsPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const res = await fetch(base + "/api/admin/pricing/weight-slabs", { cache: "no-store" });
  const data = await res.json();

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Weight Slabs</h1>
        <a href="/admin/pricing/weight-slabs/new" className="underline">Add new</a>
      </div>

      <div className="border rounded-lg">
        {data.rows.map((r: any) => (
          <div key={r.id} className="p-4 border-b flex justify-between">
            <span>{r.min_weight}–{r.max_weight} kg</span>
            <span>₹ {r.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
