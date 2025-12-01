"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function NewSurchargePage() {
  const r = useRouter();
  const [f, setF] = useState({ load_type: "", price: "" });

  async function save() {
    if (!f.load_type || !f.price) {
      toast.error("All fields required");
      return;
    }

    await fetch("/api/admin/pricing/surcharges/create", {
      method: "POST",
      body: JSON.stringify({
        load_type: f.load_type,
        price: Number(f.price),
      }),
    });

    toast.success("Surcharge added");
    r.push("/admin/pricing/surcharges");
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">New Surcharge</h1>

      <Input
        placeholder="Load Type (NON-DOCUMENT)"
        onChange={(e) => setF({ ...f, load_type: e.target.value })}
      />
      <Input
        placeholder="Price (₹)"
        onChange={(e) => setF({ ...f, price: e.target.value })}
      />

      <Button className="w-full" onClick={save}>
        Save
      </Button>
    </div>
  );
}
