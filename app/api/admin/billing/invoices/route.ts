// app/api/admin/billing/invoices/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { invoices, invoice_items } from "@/db/schema";
import { sql } from "drizzle-orm";

type CreateInvoiceBody = {
  clientId: number;
  month?: string; // YYYY-MM
  items: Array<{
    awb: string;
    charge: number;
    weight?: number;
    zone?: string;
    provider?: string;
  }>;
  note?: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    const status = url.searchParams.get("status");
    const month = url.searchParams.get("month");
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "50");
    const offset = (page - 1) * pageSize;

    const whereClauses: string[] = [];
    if (clientId) whereClauses.push(`client_id = ${sql.raw(clientId)}`);
    if (status) whereClauses.push(`status = ${sql.raw(`'${status}'`)}`);
    if (month) whereClauses.push(`month = ${sql.raw(`'${month}'`)}`);

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const rows = await db.execute(sql`
      SELECT * FROM invoices
      ${sql.raw(whereSql)}
      ORDER BY created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    const total = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM invoices ${sql.raw(whereSql)}
    `);

    return NextResponse.json({
      ok: true,
      items: rows.rows ?? [],
      total: total.rows?.[0]?.cnt ?? 0,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("Invoices GET error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateInvoiceBody;

    if (!body.clientId) return NextResponse.json({ ok: false, error: "clientId required" }, { status: 400 });
    if (!Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ ok: false, error: "items array required" }, { status: 400 });

    // compute totals
    let total = 0;
    const itemRows = body.items.map((it) => {
      const charge = Number(it.charge ?? 0);
      total += charge;
      return {
        awb: it.awb,
        charge,
        weight: it.weight ?? 0,
        zone: it.zone ?? "",
        provider: it.provider ?? "",
      };
    });

    const month = body.month ?? (new Date()).toISOString().slice(0,7); // YYYY-MM

    // insert invoice
    const ins = await db.insert(invoices).values({
      client_id: body.clientId,
      month,
      total_amount: total,
      paid_amount: 0,
      status: "unpaid",
      note: body.note ?? null,
    }).returning({ id: invoices.id });

    const invoiceId = ins[0].id;

    // insert items
    const itemsInsert = itemRows.map((ir) => ({
      invoice_id: invoiceId,
      awb: ir.awb,
      charge: ir.charge,
      weight: ir.weight,
      zone: ir.zone,
      provider: ir.provider,
    }));

    if (itemsInsert.length) {
      await db.insert(invoice_items).values(itemsInsert);
    }

    return NextResponse.json({ ok: true, id: invoiceId });
  } catch (err: any) {
    console.error("Create invoice error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
