import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, context: any) {
  try {
    // support both Promise and plain object (Next may pass either)
    const params = await Promise.resolve(context?.params ?? {});
    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });

    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice.length) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // TODO: replace with actual PDF generation and return a Response with PDF bytes
    return NextResponse.json({
      message: "PDF generation placeholder — invoice found",
      invoice: invoice[0],
    });
  } catch (err: any) {
    console.error("Invoice PDF route error:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
