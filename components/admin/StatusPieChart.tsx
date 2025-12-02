"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ef4444", "#14b8a6"];

export default function StatusPieChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  if (!data || data.length === 0)
    return <div className="text-sm text-muted-foreground">No status data available</div>;

  // Normalize
  const normalized = data.map((d) => ({
    status: d.status,
    count: d.count,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          <Pie
            data={normalized}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, value }) => `${name}: ${value}`}   // FIXED
          >
            {normalized.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
