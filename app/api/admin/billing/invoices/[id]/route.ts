// app/api/admin/billing/invoices/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { invoices, invoice_items } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const inv = await db.execute(sql`SELECT * FROM invoices WHERE id = ${sql.raw(`'${id}'`)} LIMIT 1`);
    if (!inv.rows?.length) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const items = await db.execute(sql`SELECT * FROM invoice_items WHERE invoice_id = ${sql.raw(`'${id}'`)} ORDER BY created_at`);
    const paymentsRes = await db.execute(sql`
        SELECT * FROM payments WHERE invoice_id = ${sql.raw(`'${id}'`)} ORDER BY created_at DESC
        `);
    
    return NextResponse.json({ ok: true, invoice: inv.rows[0], items: items.rows ?? [], payments: paymentsRes.rows ?? [] });
  } catch (err: any) {
    console.error("Invoice GET error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // This route allows marking a payment
  try {
    const id = params.id;
    const body = await req.json();
    const amount = Number(body.amount ?? 0);
    const note = body.note ?? null;
    const method = body.method ?? "manual";

    if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: "amount required" }, { status: 400 });

    // fetch invoice
    const invRes = await db.execute(sql`SELECT * FROM invoices WHERE id = ${sql.raw(`'${id}'`)} LIMIT 1`);
    const inv = invRes.rows?.[0];
    if (!inv) return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });

    const newPaid = Number(inv.paid_amount ?? 0) + amount;
    const status = newPaid >= Number(inv.total_amount ?? 0) ? "paid" : "partial";

    await db.execute(sql`
      UPDATE invoices
      SET paid_amount = ${sql.raw(`${newPaid}`)}, status = ${sql.raw(`'${status}'`)}, updated_at = NOW()
      WHERE id = ${sql.raw(`'${id}'`)}
    `);

    // Optionally record payments table — left as extension
    return NextResponse.json({ ok: true, newPaid, status });
  } catch (err: any) {
    console.error("Invoice pay error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
