// app/api/dtdc/label/route.ts
import { NextResponse } from "next/server";

const LABEL_URL = "https://app.shipsy.in/api/customer/integration/consignment/label/multipiece";
const API_KEY = process.env.DTDC_LABEL_API_KEY!;

export async function POST(req: Request) {
  try {
    const { awb } = await req.json();
    if (!awb) {
      return NextResponse.json({ error: "awb missing" }, { status: 400 });
    }

    const res = await fetch(LABEL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
      },
      body: JSON.stringify({ reference_number: awb }),
    });

    const raw = await res.text();
    let json;

    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON from DTDC", raw }, { status: 502 });
    }

    if (!res.ok || json.error) {
      return NextResponse.json({ error: json.error }, { status: 400 });
    }

    return NextResponse.json({ data: json.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
