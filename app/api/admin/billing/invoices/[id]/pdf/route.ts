import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice.length) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // TODO: return generated PDF
    return NextResponse.json({
      message: "PDF generation will go here",
      invoice: invoice[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
