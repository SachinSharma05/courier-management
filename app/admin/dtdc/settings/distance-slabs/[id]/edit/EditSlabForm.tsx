"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function EditSlabForm({ id }: { id: string }) {
  const r = useRouter();
  const [f, setF] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/dtdc/settings/distance-slabs`);
      const json = await res.json();
      const slab = json.rows.find((x: any) => x.id == id);
      setF(slab);
    }
    load();
  }, [id]);

  if (!f) return <div>Loading...</div>;

  async function save() {
    await fetch(`/api/dtdc/settings/distance-slabs/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        min_km: f.min_km,
        max_km: f.max_km,
        price: f.price,
      }),
    });

    r.push("/admin/dtdc/settings/distance-slabs");
  }

  return (
    <div className="max-w-md space-y-4 p-6 bg-white shadow rounded-lg">
      <h1 className="text-xl font-semibold">Edit Distance Slab</h1>

      <Input value={f.min_km} onChange={(e) => setF({ ...f, min_km: e.target.value })} />
      <Input value={f.max_km} onChange={(e) => setF({ ...f, max_km: e.target.value })} />
      <Input value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />

      <Button onClick={save} className="w-full">Save Changes</Button>
    </div>
  );
}
