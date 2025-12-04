// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import {
  consignments,
  users,
  providers,
  invoices,
  payments,
} from "@/db/schema";
import { complaints } from "@/db/schema/complaints"; // NEW TABLE
import { desc, sql } from "drizzle-orm";

// Cache
let CACHE: any = null;
let CACHE_TIME = 0;
const CACHE_TTL = 1000 * 60 * 5;

/* ----------------------------------------------------
   Time Window Helper
-----------------------------------------------------*/
function getPeriodIntervals(filter: string) {
  switch (filter) {
    case "daily": return { window: "1 day", prevWindow: "1 day", truncate: "hour" };
    case "weekly": return { window: "8 weeks", prevWindow: "8 weeks", truncate: "day" };
    case "monthly": return { window: "6 months", prevWindow: "6 months", truncate: "month" };
    case "yearly": return { window: "12 months", prevWindow: "12 months", truncate: "month" };
    default: return { window: "6 months", prevWindow: "6 months", truncate: "month" };
  }
}

/* ----------------------------------------------------
   Provider Stats (Safe for DTDC / Delhivery / XB)
-----------------------------------------------------*/
async function providerStats(providerKey: string) {
  if (providerKey !== "dtdc") {
    return { total: 0, delivered: 0, pending: 0, rto: 0 };
  }

  const r = await db.execute(sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE LOWER(last_status) LIKE '%deliver%') AS delivered,
      COUNT(*) FILTER (WHERE LOWER(last_status) LIKE '%rto%') AS rto,
      COUNT(*) FILTER (
        WHERE LOWER(last_status) NOT LIKE '%deliver%' 
        AND LOWER(last_status) NOT LIKE '%rto%'
      ) AS pending
    FROM consignments
    WHERE providers::jsonb @> ${JSON.stringify([providerKey])}::jsonb
  `);

  const row = r.rows[0] ?? {};
  return {
    total: Number(row.total || 0),
    delivered: Number(row.delivered || 0),
    pending: Number(row.pending || 0),
    rto: Number(row.rto || 0),
  };
}

/* ----------------------------------------------------
   MAIN HANDLER
-----------------------------------------------------*/
export async function GET(req: Request) {
  if (CACHE && Date.now() - CACHE_TIME < CACHE_TTL) {
    return NextResponse.json(CACHE);
  }

  try {
    const url = new URL(req.url);
    const filter = (url.searchParams.get("filter") || "monthly").toLowerCase();
    const { window, prevWindow, truncate } = getPeriodIntervals(filter);

    /* ------------------ USERS (CLIENTS) ------------------*/
    const totalClients = Number(
      (await db.execute(sql`SELECT COUNT(*) AS c FROM users WHERE role = 'client'`))
        .rows[0]?.c ?? 0
    );

    /* ------------------ PROVIDERS ------------------*/
    const totalProviders = Number(
      (await db.execute(sql`SELECT COUNT(*) AS c FROM providers`))
        .rows[0]?.c ?? 0
    );

    /* ------------------ COMPLAINTS ------------------*/
    const complaintStats = (
      await db.execute(sql`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'open') AS open,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
        FROM complaints
      `)
    ).rows[0] ?? {};

    /* ------------------ BILLING ------------------*/
    const billing = (
      await db.execute(sql`
        SELECT
          COALESCE(SUM(total_amount), 0) AS total_revenue,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) 
                            THEN total_amount ELSE 0 END), 0) AS month_revenue,
          COALESCE(SUM(CASE WHEN status = 'unpaid' THEN total_amount ELSE 0 END), 0) AS outstanding,
          COUNT(*) FILTER (WHERE status = 'unpaid') AS unpaid
        FROM invoices
      `)
    ).rows[0];

    /* ------------------ FINANCE ------------------*/
    const finance = (
      await db.execute(sql`
        SELECT
          COUNT(*) AS total_invoices,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) 
            AS monthly_invoices,
          COALESCE(SUM(total_amount * 0.18), 0) AS gst_collected, -- assume 18% GST
          COALESCE(SUM(total_amount - paid_amount), 0) AS profit
        FROM invoices
      `)
    ).rows[0];

    /* ------------------ PROVIDER PERFORMANCE ------------------*/
    const stats = {
      totalClients,
      totalProviders,

      complaints: Number(complaintStats.total ?? 0),
      complaintsTotal: Number(complaintStats.total ?? 0),
      complaintsOpen: Number(complaintStats.open ?? 0),
      complaintsInProgress: Number(complaintStats.in_progress ?? 0),
      complaintsResolved: Number(complaintStats.resolved ?? 0),

      billing: {
        totalRevenue: Number(billing.total_revenue),
        monthRevenue: Number(billing.month_revenue),
        outstanding: Number(billing.outstanding),
        unpaid: Number(billing.unpaid),
      },

      finance: {
        totalInvoices: Number(finance.total_invoices),
        monthlyInvoices: Number(finance.monthly_invoices),
        gstCollected: Number(finance.gst_collected),
        profit: Number(finance.profit),
      },

      dtdc: await providerStats("dtdc"),
      delh: await providerStats("delhivery"), // 0 for now
      xb: await providerStats("xpressbees"),  // 0 for now
    };

    /* ------------------ TREND ------------------*/
    const currentWhere = `created_at > NOW() - INTERVAL '${window}'`;
    const prevWhere = `created_at > NOW() - INTERVAL '${prevWindow}' AND created_at <= NOW() - INTERVAL '${window}'`;

    const labelExpr =
      truncate === "hour" ? "TO_CHAR(DATE_TRUNC('hour', created_at), 'HH24:MI')"
      : truncate === "day" ? "TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD')"
      : "TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY')";

    const currentTrend = (await db.execute(sql`
      SELECT ${sql.raw(labelExpr)} AS label,
             COUNT(*)::int AS value,
             DATE_TRUNC(${sql.raw(`'${truncate}'`)}, created_at) AS period_sort
      FROM consignments
      WHERE ${sql.raw(currentWhere)}
      GROUP BY label, period_sort
      ORDER BY period_sort
    `)).rows;

    const previousTrend = (await db.execute(sql`
      SELECT ${sql.raw(labelExpr)} AS label,
             COUNT(*)::int AS value,
             DATE_TRUNC(${sql.raw(`'${truncate}'`)}, created_at) AS period_sort
      FROM consignments
      WHERE ${sql.raw(prevWhere)}
      GROUP BY label, period_sort
      ORDER BY period_sort
    `)).rows;

    const totalCurrent = Number(
      (await db.execute(sql`SELECT COUNT(*) AS c FROM consignments WHERE ${sql.raw(currentWhere)}`))
        .rows[0]?.c ?? 0
    );
    const totalPrev = Number(
      (await db.execute(sql`SELECT COUNT(*) AS c FROM consignments WHERE ${sql.raw(prevWhere)}`))
        .rows[0]?.c ?? 0
    );

    const changePercent =
      totalPrev === 0 ? null : Number((((totalCurrent - totalPrev) / totalPrev) * 100).toFixed(2));

    const statusBreakdown = (
      await db.execute(sql`
        SELECT LOWER(last_status) AS status, COUNT(*)::int AS count
        FROM consignments
        WHERE ${sql.raw(currentWhere)}
        GROUP BY LOWER(last_status)
        ORDER BY count DESC
      `)
    ).rows;

    /* ------------------ LATEST CONSIGNMENTS ------------------*/
    const latest = await db
      .select()
      .from(consignments)
      .orderBy(desc(consignments.lastUpdatedOn))
      .limit(10);

    /* ------------------ Result ------------------*/
    const result = {
      ok: true,
      stats,
      charts: {
        trend: {
          current: currentTrend,
          previous: previousTrend,
          totalCurrent,
          totalPrev,
          changePercent,
        },
        statusBreakdown,
      },
      latest,
    };

    CACHE = result;
    CACHE_TIME = Date.now();

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("DASHBOARD API ERROR", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
