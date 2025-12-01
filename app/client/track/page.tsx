// app/client/track/page.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function TrackPage() {
  const [awb, setAwb] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setResp(null);
    setError(null);

    try {
      const res = await fetch("/api/providers/dtdc/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed");
      } else {
        setResp(json.result);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Track Consignment (DTDC)</h1>

      <form onSubmit={submit} className="flex gap-2 mb-6">
        <Input
          placeholder="Enter AWB / Consignment number"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />
        <Button type="submit" disabled={loading || !awb}>
          {loading ? "Tracking..." : "Track"}
        </Button>
      </form>

      <Card>
        <CardContent>
          <CardTitle>Result</CardTitle>

          {error && <div className="text-red-600 mb-2">{error}</div>}

          {!resp && !error && <div className="text-sm text-muted-foreground">Enter AWB and click Track</div>}

          {resp && (
            <div className="space-y-4">
              <div>
                <strong>AWB:</strong> {resp.awb ?? awb}
              </div>

              <div>
                <strong>Status:</strong> {resp.status ?? "Unknown"}
              </div>

              <div>
                <strong>Timeline:</strong>
                {Array.isArray(resp.timeline) && resp.timeline.length ? (
                  <ol className="ml-4 list-decimal">
                    {resp.timeline.map((ev: any, idx: number) => (
                      <li key={idx} className="py-1">
                        <div className="text-sm">{ev.date ?? ev.action_date ?? ev.time ?? ""} — {ev.status ?? ev.action ?? ev.remark ?? JSON.stringify(ev)}</div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-sm">No timeline available</div>
                )}
              </div>

              <details>
                <summary className="cursor-pointer text-sm">Raw response</summary>
                <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(resp.provider_response ?? resp.raw ?? resp, null, 2)}</pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
