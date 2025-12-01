"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function BookingsChart({
  data,
  compareData,
  filter,
}: {
  data: { label: string; value: number }[];
  compareData?: { label: string; value: number }[];
  filter?: string;
}) {
  if (!data || data.length === 0)
    return <div className="text-sm text-muted-foreground">No data available</div>;

  // Align compareData to same labels if available (map by label)
  const compareMap = new Map<string, number>();
  (compareData || []).forEach((d) => compareMap.set(d.label, d.value));

  // Build series: ensure labels from data, and include compare value if exists
  const series = data.map((d) => ({
    label: d.label,
    value: d.value,
    prev: compareMap.get(d.label) ?? null,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="This period"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          {compareData && compareData.length > 0 && (
            <Line
              type="monotone"
              dataKey="prev"
              name="Previous period"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
