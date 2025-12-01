"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function NewDistanceSlabPage() {
  const r = useRouter();
  const [f, setF] = useState({ min: "", max: "", price: "" });

  async function save() {
    if (!f.min || !f.max || !f.price) {
      toast.error("All fields are required");
      return;
    }

    await fetch("/api/dtdc/settings/distance-slabs", {
      method: "POST",
      body: JSON.stringify({
        min_km: f.min,
        max_km: f.max,
        price: f.price,
      }),
    });

    toast.success("Distance slab added");
    r.push("/admin/dtdc/settings/distance-slabs");
  }

  return (
    <div className="max-w-md space-y-4 p-6 bg-white shadow rounded-lg">
      <h1 className="text-xl font-semibold">New Distance Slab</h1>

      <Input placeholder="Min km" onChange={(e) => setF({ ...f, min: e.target.value })} />
      <Input placeholder="Max km" onChange={(e) => setF({ ...f, max: e.target.value })} />
      <Input placeholder="Price (₹)" onChange={(e) => setF({ ...f, price: e.target.value })} />

      <Button onClick={save} className="w-full">Save</Button>
    </div>
  );
}
