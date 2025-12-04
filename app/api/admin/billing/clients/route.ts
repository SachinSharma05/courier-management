// app/api/admin/billing/clients/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { invoices, invoice_items } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    if (!clientId) return NextResponse.json({ ok: false, error: "clientId required" }, { status: 400 });

    // invoices for client
    const rows = await db.execute(sql`SELECT * FROM invoices WHERE client_id = ${sql.raw(clientId)} ORDER BY created_at DESC LIMIT 100`);

    const totals = await db.execute(sql`
      SELECT
        COALESCE(SUM(total_amount)::numeric,0) as total_amount,
        COALESCE(SUM(paid_amount)::numeric,0) as paid_amount,
        COALESCE(SUM(total_amount - paid_amount)::numeric,0) as outstanding
      FROM invoices
      WHERE client_id = ${sql.raw(clientId)}
    `);

    return NextResponse.json({
      ok: true,
      invoices: rows.rows ?? [],
      summary: totals.rows?.[0] ?? { total_amount: 0, paid_amount: 0, outstanding: 0 },
    });
  } catch (err: any) {
    console.error("Client billing error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
