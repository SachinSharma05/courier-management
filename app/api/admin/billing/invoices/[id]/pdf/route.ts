// app/api/admin/billing/invoices/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { invoices, invoice_items } from "@/db/schema";
import PDFDocument from "pdfkit";
import { sql } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  const invRes = await db.execute(sql`SELECT * FROM invoices WHERE id = ${sql.raw(`'${id}'`)} LIMIT 1`);
  const invoice = invRes.rows?.[0];

  const items = await db.execute(sql`SELECT * FROM invoice_items WHERE invoice_id = ${sql.raw(`'${id}'`)}`);

  const doc = new PDFDocument();
  const chunks: any[] = [];

  doc.text(`Invoice ID: ${id}`);
  doc.text(`Client: ${invoice.client_id}`);
  doc.text(`Month: ${invoice.month}`);
  doc.text(`Total: ₹${invoice.total_amount}`);
  doc.text(`Paid: ₹${invoice.paid_amount}`);
  doc.moveDown();

  doc.text("Items:");
  items.rows.forEach((it: any) => {
    doc.text(`AWB: ${it.awb} — Charge ₹${it.charge}`);
  });

  doc.end();

  return new Response(doc as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${id}.pdf`,
    },
  });
}
