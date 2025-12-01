// api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { consignments } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

/**
 * Query params:
 *  - provider: all | dtdc | delhivery | xpressbees
 *  - filter: daily | weekly | monthly | yearly | range
 *  - start, end: ISO date strings (used when filter=range)
 *
 * Response includes:
 *  - stats
 *  - charts: { monthlyTrend (current), compareMonthlyTrend (previous), statusBreakdown }
 *  - latest
 */

// Simple in-memory cache (persists until server restarts)
let CACHE: any = null;
let CACHE_TIME = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes


function getPeriodIntervals(filter: string) {
  // returns [currentIntervalText, intervalSQL] where intervalSQL can be used in `NOW() - INTERVAL ...`
  switch (filter) {
    case "daily":
      return { window: "1 day", prevWindow: "1 day", truncate: "hour", labelFmt: "HH24:MI" };
    case "weekly":
      return { window: "8 weeks", prevWindow: "8 weeks", truncate: "day", labelFmt: "Dy" };
    case "monthly":
      return { window: "6 months", prevWindow: "6 months", truncate: "month", labelFmt: "Mon" };
    case "yearly":
      return { window: "12 months", prevWindow: "12 months", truncate: "month", labelFmt: "Mon YYYY" };
    default:
      return { window: "6 months", prevWindow: "6 months", truncate: "month", labelFmt: "Mon" };
  }
}

function buildProviderFilter(provider?: string) {
  if (!provider || provider === "all" || provider === "master") return sql``;
  // assuming your consignments table has 'provider' column; if not adjust
  return sql`AND LOWER(${consignments.provider}) = ${provider.toLowerCase()}`;
}

export async function GET(req: Request) {
  if (CACHE && Date.now() - CACHE_TIME < CACHE_TTL) {
    return NextResponse.json(CACHE);
  }

  try {
    const url = new URL(req.url);
    const provider = (url.searchParams.get("provider") || "all").toLowerCase();
    const filter = (url.searchParams.get("filter") || "monthly").toLowerCase();
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");

    // SELECT interval settings
    const { window, prevWindow, truncate, labelFmt } = getPeriodIntervals(filter);
    const providerFilterSql = buildProviderFilter(provider);

    /* -----------------------------
       STATS (counts)
    ------------------------------ */
    const statsQuery = await db
      .select({
        total: sql<number>`COUNT(*)`,
        delivered: sql<number>`SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%deliver%' THEN 1 ELSE 0 END)`,
        rto: sql<number>`SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%rto%' THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN LOWER(${consignments.lastStatus}) NOT LIKE '%deliver%' AND LOWER(${consignments.lastStatus}) NOT LIKE '%rto%' THEN 1 ELSE 0 END)`,
      })
      .from(consignments)
      // apply provider filter here if required
      .where(sql`${sql.raw(provider === "all" ? "TRUE" : `LOWER(${consignments.provider}) = ${provider}`)}`);

    const statsRow = statsQuery[0] ?? { total: 0, delivered: 0, pending: 0, rto: 0 };

    /* -----------------------------
       Build current / previous time ranges
    ------------------------------ */
    let currentWhere = "";
    let prevWhere = "";
    if (filter === "range" && startParam && endParam) {
      // use explicit start / end
      const s = startParam;
      const e = endParam;
      currentWhere = `created_at BETWEEN ${sql.raw(`'${s}'::timestamptz`)} AND ${sql.raw(`'${e}'::timestamptz`)}`;
      // previous period: same duration immediately before start
      // We won't compute previous for arbitrary ranges to keep things simple — return empty previous
      prevWhere = "FALSE";
    } else {
      // use relative windows
      currentWhere = `created_at > NOW() - INTERVAL '${window}'`;
      prevWhere = `created_at > NOW() - INTERVAL '${prevWindow}' AND created_at <= NOW() - INTERVAL '${window}'`;
    }

    /* -----------------------------
       STATUS BREAKDOWN (current period)
    ------------------------------ */
    const statusSql = sql`
      SELECT LOWER(last_status) AS status, COUNT(*)::int AS count
      FROM consignments
      WHERE ${sql.raw(currentWhere)}
      ${sql.raw(provider === "all" ? "" : `AND LOWER(provider) = ${provider}`)}
      GROUP BY LOWER(last_status)
      ORDER BY count DESC
    `;
    const statusBreakdown = await db.execute(statusSql);

    /* -----------------------------
       TREND - current period
       grouped by truncate (hour/day/month)
    ------------------------------ */
    // label generation depends on truncate and labelFmt
    const labelExpr =
      truncate === "hour"
        ? "TO_CHAR(DATE_TRUNC('hour', created_at), 'HH24:MI')"
        : truncate === "day"
        ? "TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD')"
        : truncate === "month"
        ? "TO_CHAR(DATE_TRUNC('month', created_at), 'Mon')"
        : "TO_CHAR(DATE_TRUNC('month', created_at), 'Mon')";

    const currentTrendSql = sql`
      SELECT ${sql.raw(labelExpr)} AS label,
             COUNT(*)::int AS value,
             DATE_TRUNC(${sql.raw(`'${truncate}'`)}, created_at) AS period_sort
      FROM consignments
      WHERE ${sql.raw(currentWhere)}
      ${sql.raw(provider === "all" ? "" : `AND LOWER(provider) = ${provider}`)}
      GROUP BY label, period_sort
      ORDER BY period_sort
    `;
    const currentTrend = (await db.execute(currentTrendSql)).rows ?? [];

    /* -----------------------------
       TREND - previous period (same window immediately before current window)
    ------------------------------ */
    let prevTrend = [];
    if (filter !== "range") {
      const prevTrendSql = sql`
        SELECT ${sql.raw(labelExpr)} AS label,
               COUNT(*)::int AS value,
               DATE_TRUNC(${sql.raw(`'${truncate}'`)}, created_at) AS period_sort
        FROM consignments
        WHERE ${sql.raw(prevWhere)}
        ${sql.raw(provider === "all" ? "" : `AND LOWER(provider) = ${provider}`)}
        GROUP BY label, period_sort
        ORDER BY period_sort
      `;
      prevTrend = (await db.execute(prevTrendSql)).rows ?? [];
    }

    /* -----------------------------
       Compute simple period totals for comparison
    ------------------------------ */
    const totalCurrent = Number(
      (await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM consignments WHERE ${sql.raw(currentWhere)} ${sql.raw(provider === "all" ? "" : `AND LOWER(provider) = ${provider}`)}`)).rows?.[0]?.cnt ?? 0
    );
    let totalPrev = 0;
    if (filter !== "range") {
      totalPrev = Number(
        (await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM consignments WHERE ${sql.raw(prevWhere)} ${sql.raw(provider === "all" ? "" : `AND LOWER(provider) = ${provider}`)}`)).rows?.[0]?.cnt ?? 0
      );
    }

    const changePercent = totalPrev === 0 ? null : Number((((totalCurrent - totalPrev) / totalPrev) * 100).toFixed(2));

    /* -----------------------------
       LATEST CONSIGNMENTS
    ------------------------------ */
    const latest = await db
      .select()
      .from(consignments)
      .where(sql`${sql.raw(provider === "all" ? "TRUE" : `LOWER(${consignments.provider}) = ${provider}`)}`)
      .orderBy(desc(consignments.lastUpdatedOn))
      .limit(10);

    /* -----------------------------
       Final response
    ------------------------------ */

    const result = {
      ok: true,
      stats: {
        total: Number(statsRow.total ?? 0),
        delivered: Number(statsRow.delivered ?? 0),
        rto: Number(statsRow.rto ?? 0),
        pending: Number(statsRow.pending ?? 0),
      },
      charts: {
        trend: {
          current: currentTrend,
          previous: prevTrend,
          totalCurrent,
          totalPrev,
          changePercent,
        },
        statusBreakdown: statusBreakdown.rows ?? [],
      },
      latest,
    }

    CACHE = result;
    CACHE_TIME = Date.now();
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Dashboard API Error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
