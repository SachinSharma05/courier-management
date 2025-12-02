"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

import BookingsChart from "./BookingsChart";
import StatusPieChart from "./StatusPieChart";

export type FilterType = "daily" | "weekly" | "monthly" | "yearly" | "range";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface StatusItem {
  status: string;
  count: number;
}

export interface ProviderCharts {
  trend: {
    current: TrendPoint[];
    previous: TrendPoint[];
    totalCurrent: number;
    totalPrev: number | null;
    changePercent: number | null;
  };
  statusBreakdown: StatusItem[];
}

export interface AnalyticsCardProps {
  charts: ProviderCharts;
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

export default function AnalyticsCard({
  charts,
  filter,
  onFilterChange,
}: AnalyticsCardProps) {
  /* Provider tab */
  const [provider, setProvider] = useState<
    "all" | "dtdc" | "delhivery" | "xpressbees"
  >("all");

  const current = charts.trend.current ?? [];
  const previous = charts.trend.previous ?? [];
  const status = charts.statusBreakdown ?? [];
  const totalCurrent = charts.trend.totalCurrent ?? 0;
  const totalPrev = charts.trend.totalPrev ?? 0;
  const changePercent = charts.trend.changePercent ?? null;

  return (
    <Card className="shadow-sm border rounded-lg">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-semibold">Analytics Overview</CardTitle>
          <div className="text-sm text-muted-foreground">
            {totalCurrent} shipments
            {typeof changePercent === "number" && (
              <span className={`ml-3 font-medium ${changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {changePercent >= 0 ? "▲" : "▼"} {Math.abs(changePercent)}%
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* PROVIDER TABS */}
        <Tabs
          value={provider}
          onValueChange={(val) => setProvider(val as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="dtdc">DTDC</TabsTrigger>
            <TabsTrigger value="delhivery">Delhivery</TabsTrigger>
            <TabsTrigger value="xpressbees">XpressBees</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* FILTER BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["daily", "weekly", "monthly", "yearly"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(f)}
            >
              {f.toUpperCase()}
            </Button>
          ))}

          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon size={16} />
                Date Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar mode="range" />
            </PopoverContent>
          </Popover>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bookings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingsChart data={current} compareData={previous} filter={filter} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart data={status} />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}