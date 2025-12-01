// lib/providers/dtdc.ts
import type { Awaitable } from "type-fest";

// lib/providers/dtdc.ts

export type DtdcBookingCredentials = {
  customer_code?: string;
  username?: string;
  password?: string;
  api_key?: string;
  token?: string;
};

export function makeDTDCClient(creds: DtdcBookingCredentials) {
  const base = process.env.DTDC_API_BASE_URL || "https://api.dtdc.in";

  async function track(awb: string) {
    // omitted - existing code
    return {}; 
  }

  async function book(consignments: any[]) {
    if (!creds.customer_code) throw new Error("Missing DTDC customer_code");

    const url = `${base}/book`; // ❗ Replace with real DTDC booking endpoint

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (creds.api_key) headers["x-api-key"] = creds.api_key;
    if (creds.token) headers["Authorization"] = `Bearer ${creds.token}`;

    const body = {
      customer_code: creds.customer_code,
      consignments,
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Invalid DTDC response: " + text);
    }

    return json;
  }

  async function getLabel(awb: string): Promise<{ ok: boolean; label_base64?: string; error?: string }> {
    // In dev you can mock
    if (process.env.NODE_ENV === "development" && process.env.DTDC_MOCK === "1") {
      // Return a tiny blank PDF base64 for testing
      const b64 = "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nPj4KZW5kb2JqCnhyZWYK" +
                  "MCAyCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMyAwMDAwMCBuIAowMDAwMDAwNzU2IDAwMDAw" +
                  "IG4gCnRyYWlsZXIKPDwvU2l6ZSAyL1Jvb3QgMSAwIFIvSW5mbyAyIDAgUi9JRCBbPEE2NjEzNzU2NzU4" +
                  "OTU2QTc2RkUxQkUzRjE5QzU0Qz5dPj4Kc3RhcnR4cmVmCjg4NQolJUVPRgo=";
      return { ok: true, label_base64: b64 };
    }

    // Replace with actual DTDC label API endpoint and request body according to DTDC spec.
    const url = `${base}/label`; // <-- update to real endpoint
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (creds.api_key) headers["x-api-key"] = creds.api_key;
    if (creds.token) headers["Authorization"] = `Bearer ${creds.token}`;

    const body = { awb, customer_code: creds.customer_code };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `DTDC returned ${res.status}: ${text}` };
    }

    // Expect DTDC returns base64 label in a JSON field - adjust to actual response structure
    const json = await res.json();
    // e.g. json.data[0].label or json.label
    const base64 = json?.data?.[0]?.label ?? json?.label ?? null;
    if (!base64) {
      return { ok: false, error: "DTDC response did not include label" };
    }
    return { ok: true, label_base64: base64 };
  }

  return { track, book, getLabel };
}
