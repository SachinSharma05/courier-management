// app/api/admin/clients/[id]/sync/route.ts
import { NextResponse } from "next/server";
// import { syncClientShipments } from "@/lib/dtdc/sync";
import { getServerSession } from "@/lib/auth/getServerSession"; // your helper

export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    // 1. Auth guard (super admin only)
    const session = await getServerSession();
    if (!session?.ok) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    if (session.user.role !== "super_admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const id = Number(context.params.id);
    if (!id) return NextResponse.json({ ok: false, error: "Invalid client id" }, { status: 400 });

    // const result = await syncClientShipments(id);

    // return NextResponse.json({ ok: true, ...result });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Sync failed" }, { status: 500 });
  }
}