"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NewWeightSlabPage() {
  const r = useRouter();
  const [form, setForm] = useState({ min: "", max: "", price: "" });

  async function save() {
    await fetch("/api/admin/pricing/weight-slabs/create", {
      method: "POST",
      body: JSON.stringify({
        min_weight: Number(form.min),
        max_weight: Number(form.max),
        price: Number(form.price),
      }),
    });
    toast.success("Slab added");
    r.push("/admin/pricing/weight-slabs");
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">New Weight Slab</h1>

      <Input placeholder="Min weight" onChange={(e) => setForm({ ...form, min: e.target.value })} />
      <Input placeholder="Max weight" onChange={(e) => setForm({ ...form, max: e.target.value })} />
      <Input placeholder="Price" onChange={(e) => setForm({ ...form, price: e.target.value })} />

      <Button onClick={save} className="w-full">Save</Button>
    </div>
  );
}
