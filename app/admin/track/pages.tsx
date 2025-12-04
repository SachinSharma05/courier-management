"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminTrackPage() {
  const [awb, setAwb] = useState("");
  const [result, setResult] = useState(null);

  async function search() {
    const res = await fetch(`/api/admin/track?awb=${awb}`);
    const json = await res.json();
    setResult(json);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Track</h1>

      <div className="flex gap-3">
        <Input value={awb} onChange={(e)=>setAwb(e.target.value)} placeholder="Enter any AWB"/>
        <Button onClick={search}>Track</Button>
      </div>

      {result && (
        <pre className="p-4 bg-slate-100 text-sm rounded">{JSON.stringify(result,null,2)}</pre>
      )}
    </div>
  );
}
