"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClientDashboard() {
  const [providers, setProviders] = useState<string[]>([]);
  const [active, setActive] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
    rto: 0,
  });

  const [latest, setLatest] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/client/providers")
      .then((r) => r.json())
      .then((d) => setProviders(d.providers || []));
  }, []);

  useEffect(() => {
    const url =
      active === "all"
        ? "/api/client/dashboard"
        : `/api/provider/${active}/dashboard`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setStats(d.stats);
        setLatest(d.latest || []);
      });
  }, [active]);

  return (
    <div className="space-y-8">

      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* FILTER TABS (Only if multiple providers) */}
      {providers.length > 1 && (
        <div className="flex gap-3 border-b pb-3">
          <TabButton label="All" value="all" active={active} setActive={setActive} />
          {providers.map((p) => (
            <TabButton
              key={p}
              label={p.toUpperCase()}
              value={p}
              active={active}
              setActive={setActive}
            />
          ))}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Shipments" value={stats.total} badge="All" variant="secondary" />
        <StatCard label="Delivered" value={stats.delivered} badge="Delivered" variant="default" />
        <StatCard label="Pending" value={stats.pending} badge="Pending" variant="outline" />
        <StatCard label="RTO" value={stats.rto} badge="RTO" variant="destructive" />
      </div>

      {/* LATEST */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Consignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {latest.length === 0 && (
              <div className="text-muted-foreground text-sm">No consignments yet.</div>
            )}

            {latest.map((c) => (
              <div
                key={c.awb}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <div className="font-medium">{c.awb}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.origin} → {c.destination}
                  </div>
                </div>

                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function TabButton({ label, value, active, setActive }: any) {
  return (
    <button
      onClick={() => setActive(value)}
      className={`px-4 py-2 rounded-md ${
        active === value ? "bg-black text-white" : "bg-white hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, badge, variant }: any) {
  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle className="text-sm">{label}</CardTitle>
        <Badge variant={variant}>{badge}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
