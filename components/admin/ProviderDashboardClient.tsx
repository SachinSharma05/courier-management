"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight } from "lucide-react";
import AnalyticsCard, { ProviderCharts } from "./AnalyticsCard";

export default function ProviderDashboardClient({ provider, title }: { provider: string; title?: string }) {
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0, rto: 0 });
  const [charts, setCharts] = useState<ProviderCharts>({
    trend: {
      current: [],
      previous: [],
      totalCurrent: 0,
      totalPrev: 0,
      changePercent: null,
    },
    statusBreakdown: [],
  });
  const [latest, setLatest] = useState<any[]>([]);
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly" | "yearly" | "range">("monthly");

  async function load() {
    try {
      const res = await fetch(`/api/provider/${provider}/dashboard`);
      const json = await res.json();
      if (!json.ok) return toast.error(json.error || "Failed to load dashboard");

      // set basic stats (unchanged)
      setStats(json.stats ?? { total: 0, delivered: 0, pending: 0, rto: 0 });
      setLatest(json.latest ?? []);

      // If backend already returns charts in the correct shape, use it.
      // Otherwise map stats -> ProviderCharts so AnalyticsCard receives the required shape.
      if (json.charts && json.charts.trend && json.charts.statusBreakdown) {
        setCharts(json.charts as ProviderCharts);
      } else {
        const s = json.stats ?? { total: 0, delivered: 0, pending: 0, rto: 0 };

        const mapped: ProviderCharts = {
          trend: {
            // current trend uses high-level buckets delivered/pending/rto
            current: [
              { label: "Delivered", value: s.delivered ?? 0 },
              { label: "Pending", value: s.pending ?? 0 },
              { label: "RTO", value: s.rto ?? 0 },
            ],
            previous: [], // no previous period data available from API
            totalCurrent: s.total ?? 0,
            totalPrev: 0,
            changePercent: null,
          },
          statusBreakdown: [
            { status: "Delivered", count: s.delivered ?? 0 },
            { status: "Pending", count: s.pending ?? 0 },
            { status: "RTO", count: s.rto ?? 0 },
          ],
        };

        setCharts(mapped);
      }
    } catch (e) {
      console.error("Failed loading provider dashboard:", e);
      toast.error("Failed to load dashboard");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{title ?? provider.toUpperCase()}</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} badge="All" />
        <StatCard label="Delivered" value={stats.delivered} badge="Delivered" />
        <StatCard label="Pending" value={stats.pending} badge="Pending" />
        <StatCard label="RTO" value={stats.rto} badge="RTO" />
      </div>

      <AnalyticsCard
        charts={charts}
        filter={filter}
        onFilterChange={(f) => setFilter(f)}
      />

      <Card>
        <CardHeader><CardTitle>Latest Consignments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[420px]">
            <div className="divide-y divide-gray-200">
              {latest.length === 0 && <div className="p-4 text-sm text-gray-500">No recent consignments.</div>}
              {latest.map((r) => (
                <div key={r.awb} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.awb}</div>
                    <div className="text-xs text-gray-500">{r.origin} → {r.destination}</div>
                  </div>
                  <Link href={`/admin/dtdc/${encodeURIComponent(r.awb)}`}>
                    <Button variant="outline" size="sm">
                      View <ArrowUpRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* small stat card */
function StatCard({ label, value, badge }: { label: string; value: number; badge?: string }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm">{label}</CardTitle>
        {badge && <div className="text-xs text-muted-foreground">{badge}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
