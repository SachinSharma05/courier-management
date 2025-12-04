"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AnalyticsCard, { FilterType } from "@/components/admin/AnalyticsCard";

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProviders: 0,

    complaints: 0,
    complaintsTotal: 0,
    complaintsOpen: 0,
    complaintsInProgress: 0,
    complaintsResolved: 0,

    billing: {
      totalRevenue: 0,
      monthRevenue: 0,
      outstanding: 0,
      unpaid: 0,
    },

    finance: {
      totalInvoices: 0,
      monthlyInvoices: 0,
      gstCollected: 0,
      profit: 0,
    },

    dtdc: { total: 0, delivered: 0, pending: 0, rto: 0 },
    delh: { total: 0, delivered: 0, pending: 0, rto: 0 },
    xb: { total: 0, delivered: 0, pending: 0, rto: 0 },
  });

  const [charts, setCharts] = useState<any>(null);
  const [latest, setLatest] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("monthly");

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard?provider=all&filter=monthly");
      const json = await res.json();

      if (!json.ok) return toast.error("Failed to load master dashboard");

      setStats(json.stats);
      setCharts(json.charts);
      setLatest(json.latest ?? []);
    } catch {
      toast.error("Failed to load dashboard");
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Master Dashboard</h1>

        <div className="flex items-center gap-2">
          <Button onClick={() => fetchDashboard()} size="sm" variant="outline">
            Refresh
          </Button>
          <Link href="/admin/dtdc/track">
            <Button size="sm">Open Track</Button>
          </Link>
        </div>
      </div>

      {/* ============================ */}
      {/* ROW 1 — SYSTEM OVERVIEW      */}
      {/* ============================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link href="/admin/clients">
          <OverviewCard title="Total Clients" value={stats.totalClients} />
        </Link>

        <Link href="/admin/providers">
          <OverviewCard title="Total Providers" value={stats.totalProviders} />
        </Link>

        <Link href="/admin/complaints">
          <OverviewCard title="Complaints" value={stats.complaints} variant="red" />
        </Link>

        <Link href="/admin/settings">
          <OverviewCard title="Settings" value={1} variant="gray" />
        </Link>
      </div>

      {/* ============================ */}
      {/* ROW 2 — PROVIDER PERFORMANCE */}
      {/* ============================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <ProviderCard
          title="DTDC"
          color="bg-[#005BBB]"
          stats={stats.dtdc}
          href="/admin/dtdc/track"
        />

        <ProviderCard
          title="Delhivery"
          color="bg-black"
          stats={stats.delh}
          href="/admin/delhivery/track"
        />

        <ProviderCard
          title="XpressBees"
          color="bg-[#F9A825]"
          stats={stats.xb}
          href="/admin/xpressbees/track"
        />
      </div>

      {/* ============================ */}
      {/* ROW 3 — BILLING & REVENUE   */}
      {/* ============================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link href="/admin/billing">
          <OverviewCard title="Total Revenue" value={stats.billing.totalRevenue} />
        </Link>

        <Link href="/admin/billing?filter=month">
          <OverviewCard title="Revenue This Month" value={stats.billing.monthRevenue} />
        </Link>

        <Link href="/admin/billing/outstanding">
          <OverviewCard title="Outstanding Amount" value={stats.billing.outstanding} variant="red" />
        </Link>

        <Link href="/admin/billing/invoices">
          <OverviewCard title="Unpaid Invoices" value={stats.billing.unpaid} variant="gray" />
        </Link>
      </div>

      {/* ============================ */}
      {/* ROW 4 — COMPLAINT WORKFLOW   */}
      {/* ============================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        <Link href="/admin/complaints">
          <OverviewCard title="Total Complaints" value={stats.complaintsTotal} />
        </Link>

        <Link href="/admin/complaints?status=open">
          <OverviewCard title="Open" value={stats.complaintsOpen} variant="red" />
        </Link>

        <Link href="/admin/complaints?status=in_progress">
          <OverviewCard title="In Progress" value={stats.complaintsInProgress} />
        </Link>

        <Link href="/admin/complaints?status=resolved">
          <OverviewCard title="Resolved" value={stats.complaintsResolved} variant="gray" />
        </Link>
      </div>

      {/* ============================ */}
      {/* ROW 5 — FINANCE REPORTS      */}
      {/* ============================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        <Link href="/admin/billing/invoices">
          <OverviewCard title="Total Invoices" value={stats.finance.totalInvoices} />
        </Link>

        <Link href="/admin/billing/invoices?filter=month">
          <OverviewCard title="Invoices This Month" value={stats.finance.monthlyInvoices} />
        </Link>

        <Link href="/admin/finance/gst">
          <OverviewCard title="GST Collected" value={stats.finance.gstCollected} />
        </Link>

        <Link href="/admin/finance/profit">
          <OverviewCard title="Profit Estimate" value={stats.finance.profit} variant="gray" />
        </Link>
      </div>

      {/* ============================ */}
      {/* ANALYTICS + LATEST ENTRIES   */}
      {/* ============================ */}
      {charts && (
        <AnalyticsCard charts={charts} filter={filter} onFilterChange={setFilter} />
      )}

    </div>
  );
}

/* --------------------------------------------
   SIMPLE CARD
--------------------------------------------- */
function OverviewCard({ title, value, variant = "white" }) {
  const colors =
    variant === "red"
      ? "border-red-200 bg-red-50"
      : variant === "gray"
      ? "border-gray-300 bg-gray-50"
      : "bg-white";

  return (
    <Card className={`p-4 hover:shadow-md transition cursor-pointer ${colors}`}>
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------
   PROVIDER CARD
--------------------------------------------- */
function ProviderCard({ title, color, stats, href }) {
  return (
    <Link href={href}>
      <Card className={`${color} text-white p-5 hover:opacity-90 transition cursor-pointer`}>
        <div className="text-xl font-semibold mb-4">{title}</div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/20 rounded-md p-3">
            <div className="text-sm opacity-80">Delivered</div>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </div>

          <div className="bg-white/20 rounded-md p-3">
            <div className="text-sm opacity-80">Pending</div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </div>

          <div className="bg-white/20 rounded-md p-3">
            <div className="text-sm opacity-80">RTO</div>
            <div className="text-2xl font-bold">{stats.rto}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
