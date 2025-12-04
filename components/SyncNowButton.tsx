// components/SyncNowButton.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SyncNowButton({ clientId }: { clientId: number }) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/sync`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Sync failed");
      toast.success(`Synced ${json.totalSynced} shipments`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleSync} disabled={loading}>
      {loading ? "Syncing..." : "Sync Now"}
    </Button>
  );
}
