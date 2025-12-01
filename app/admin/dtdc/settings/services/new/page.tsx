"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function NewServicePage() {
  const r = useRouter();
  const [f, setF] = useState({
    code: "",
    base_price: "",
    priority_multiplier: "",
  });

  async function save() {
    await fetch("/api/admin/pricing/services/create", {
      method: "POST",
      body: JSON.stringify({
        code: f.code,
        base_price: Number(f.base_price),
        priority_multiplier: Number(f.priority_multiplier),
      }),
    });

    toast.success("Service added");
    r.push("/admin/pricing/services");
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">New Service Type</h1>

      <Input placeholder="Code (STANDARD)" onChange={(e) => setF({ ...f, code: e.target.value })} />
      <Input placeholder="Base Price" onChange={(e) => setF({ ...f, base_price: e.target.value })} />
      <Input placeholder="Priority Multiplier (optional)" onChange={(e) => setF({ ...f, priority_multiplier: e.target.value })} />

      <Button onClick={save} className="w-full">Save</Button>
    </div>
  );
}
