"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight } from "lucide-react";

import AnalyticsCard, { FilterType } from "@/components/admin/AnalyticsCard";

export default function ReportsPage() {
  /* ---------------------------------------
      STATE
  ---------------------------------------- */
  const [provider, setProvider] = useState<"master" | "dtdc" | "delhivery" | "xpressbees">("master");

  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
    rto: 0,
  });

  const [charts, setCharts] = useState<any>({
    trend: {
      current: [],
      previous: [],
      totalCurrent: 0,
      totalPrev: null,
      changePercent: null,
    },
    statusBreakdown: [],
  });

  const [latest, setLatest] = useState<any[]>([]);

  const [filter, setFilter] = useState<FilterType>("monthly");

  /* ---------------------------------------
      FETCH DASHBOARD
  ---------------------------------------- */
  async function fetchDashboard(p = provider, f = filter) {
    const cacheKey = `dashboard_${provider}_${filter}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const obj = JSON.parse(cached);
      if (Date.now() - obj.time < 5 * 60 * 1000) { // 5 min
        setStats(obj.data.stats);
        setCharts(obj.data.charts);
        setLatest(obj.data.latest);
        return;
      }
    }

    try {
      const qp = new URLSearchParams();
      qp.set("provider", p === "master" ? "all" : p);
      qp.set("filter", f);
      const res = await fetch(`/api/admin/dashboard?${qp.toString()}`);
      const json = await res.json();

      if (!json.ok) {
        toast.error("Failed to load master dashboard");
        return;
      }

      localStorage.setItem(
        cacheKey,
        JSON.stringify({ time: Date.now(), data: json })
      );

      setStats(json.stats ?? { total: 0, delivered: 0, pending: 0, rto: 0 });

      // NOTE: API returns charts.trend.current / previous and statusBreakdown
      setCharts({
        trend: {
          current: json.charts?.trend?.current ?? [],
          previous: json.charts?.trend?.previous ?? [],
          totalCurrent: json.charts?.trend?.totalCurrent ?? 0,
          totalPrev: json.charts?.trend?.totalPrev ?? null,
          changePercent: json.charts?.trend?.changePercent ?? null,
        },
        statusBreakdown: json.charts?.statusBreakdown ?? [],
      });

      setLatest(json.latest ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard");
    }
  }

  /* ---------------------------------------
      ON LOAD
  ---------------------------------------- */
  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------
      PROVIDER / FILTER EFFECTS
  ---------------------------------------- */
  useEffect(() => {
    // provider and filter drive the API
    fetchDashboard(provider, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, filter]);

  /* ---------------------------------------
      UI
  ---------------------------------------- */
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Master Dashboard</h1>

        <div className="flex items-center gap-2">
          <Button onClick={() => fetchDashboard()} size="sm" variant="outline">Refresh</Button>
          <Link href="/admin/dtdc/track">
            <Button size="sm">Open Track</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3 border-b pb-3 text-sm">
        {[
          { key: "master", label: "All Providers" },
          { key: "dtdc", label: "DTDC" },
          { key: "delhivery", label: "Delhivery" },
          { key: "xpressbees", label: "XpressBees" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setProvider(t.key as any)}
            className={`px-4 py-2 rounded-md transition ${
              provider === t.key
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link href= "/admin/dtdc/track?status=all">
          <Stat label="Total Shipments" value={stats.total} badge="All" variant="secondary" />
        </Link>
        <Link href= "/admin/dtdc/track?status=delivered">
          <Stat label="Delivered" value={stats.delivered} badge="Delivered" variant="default" />
        </Link>
        <Link href= "/admin/dtdc/track?status=pending">
          <Stat label="Pending" value={stats.pending} badge="Pending" variant="outline" />
        </Link>
        <Link href= "/admin/dtdc/track?status=RTO">
          <Stat label="RTO" value={stats.rto} badge="RTO" variant="destructive" />
        </Link>
      </div>

      <AnalyticsCard
        charts={charts}
        filter={filter}
        onFilterChange={(f) => setFilter(f as FilterType)}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Latest Consignments</CardTitle>
            <div className="text-sm text-muted-foreground">{latest.length} shown</div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[420px]">
            <div className="divide-y divide-gray-200">
              {latest.length === 0 && (
                <div className="p-4 text-muted-foreground text-sm">
                  No recent consignments found.
                </div>
              )}

              {latest.map((r) => (
                <div key={r.awb} className="flex items-center gap-3 p-4">
                  <div className="w-12 flex-shrink-0">
                    <div className="h-10 w-10 rounded-md bg-slate-50 flex items-center justify-center text-sm font-semibold">
                      {String(r.awb || "").slice(0, 2)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm">{r.awb}</div>
                        <div className="text-xs text-muted-foreground">{r.origin} → {r.destination}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm">{r.lastStatus ?? "-"}</div>
                        <div className="text-xs text-muted-foreground mt-1">{r.lastUpdatedOn ?? ""}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/dtdc/${encodeURIComponent(r.awb)}`}>
                      <Button size="sm" variant="outline">
                        View Details <ArrowUpRight className="ml-2" size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------------
      REUSABLE STAT CARD
---------------------------------------- */
function Stat({
  label,
  value,
  badge,
  variant,
}: {
  label: string;
  value: number;
  badge: string;
  variant:
    | "default"
    | "secondary"
    | "outline"
    | "destructive";
}) {
  return (
    <Card className="hover:shadow-lg transition cursor-pointer">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm">{label}</CardTitle>
        <Badge variant={variant}>{badge}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
