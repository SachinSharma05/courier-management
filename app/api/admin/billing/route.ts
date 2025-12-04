// app/api/admin/billing/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { invoices, invoice_items } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // Total revenue (sum of total_amount)
    const totalRes = await db.execute(sql`
      SELECT COALESCE(SUM(total_amount)::numeric, 0) AS total_revenue
      FROM invoices
    `);

    // Revenue this month (based on month column or created_at)
    const monthRes = await db.execute(sql`
      SELECT COALESCE(SUM(total_amount)::numeric, 0) AS month_revenue
      FROM invoices
      WHERE month = TO_CHAR(NOW(), 'YYYY-MM')
    `);

    // Outstanding (sum of unpaid portion)
    const outstandingRes = await db.execute(sql`
      SELECT COALESCE(SUM(total_amount - paid_amount)::numeric, 0) AS outstanding
      FROM invoices
      WHERE status != 'paid'
    `);

    // invoice counts
    const countsRes = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
        COUNT(*) FILTER (WHERE status = 'unpaid') AS unpaid_count,
        COUNT(*) FILTER (WHERE status = 'partial') AS partial_count,
        COUNT(*) AS total_count
      FROM invoices
    `);

    // invoices this month
    const invoicesMonthRes = await db.execute(sql`
      SELECT COUNT(*)::int AS c FROM invoices WHERE month = TO_CHAR(NOW(), 'YYYY-MM')
    `);

    // top clients by revenue (last 6 months)
    const topClients = await db.execute(sql`
      SELECT client_id, COALESCE(SUM(total_amount)::numeric,0) as revenue
      FROM invoices
      WHERE created_at > NOW() - INTERVAL '6 months'
      GROUP BY client_id
      ORDER BY revenue DESC
      LIMIT 5
    `);

    const result = {
      ok: true,
      billing: {
        totalRevenue: Number(totalRes.rows?.[0]?.total_revenue ?? 0),
        revenueThisMonth: Number(monthRes.rows?.[0]?.month_revenue ?? 0),
        outstanding: Number(outstandingRes.rows?.[0]?.outstanding ?? 0),
        paidInvoicesCount: Number(countsRes.rows?.[0]?.paid_count ?? 0),
        unpaidInvoicesCount: Number(countsRes.rows?.[0]?.unpaid_count ?? 0),
        partialInvoicesCount: Number(countsRes.rows?.[0]?.partial_count ?? 0),
        invoicesThisMonth: Number(invoicesMonthRes.rows?.[0]?.c ?? 0),
        topClients: topClients.rows ?? [],
      },
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Billing stats error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
