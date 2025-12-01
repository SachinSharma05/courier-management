"use client";

import { useState } from "react";
import Papa from "papaparse";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function BulkBookingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  function handleCSVUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        if (parsed.errors.length) {
          toast.error("CSV parsing error: " + parsed.errors[0].message);
          return;
        }
        setRows(parsed.data);
        toast.success("CSV Loaded Successfully");
      },
    });
  }

  async function submit() {
    if (!rows.length) {
      toast.error("No rows parsed");
      return;
    }

    // Map CSV to DTDC consignment format
    const consignments = rows.map((r) => {
      const cons: any = {
        reference_number: r.reference_number || `AUTO-${Date.now()}`,
        service_type_id: r.service_type_id || "STANDARD",
        load_type: r.load_type || "DOCUMENT",
        weight: Number(r.weight || 1),
        weight_unit: "kg",

        origin_details: {
          name: r.origin_name,
          phone: r.origin_phone,
          pincode: r.origin_pincode,
        },
        destination_details: {
          name: r.dest_name,
          phone: r.dest_phone,
          pincode: r.dest_pincode,
        },
      };

      if (cons.load_type === "NON-DOCUMENT") {
        cons.dimension_unit = "cm";
        cons.length = Number(r.length || 0);
        cons.width = Number(r.width || 0);
        cons.height = Number(r.height || 0);
      }

      return cons;
    });

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/providers/dtdc/bulk-book", {
        method: "POST",
        body: JSON.stringify({ consignments }),
      });

      const json = await res.json();
      setLoading(false);

      if (!json.ok) {
        toast.error(json.error || "Bulk booking failed");
        return;
      }

      setResult(json.result);
      toast.success("Bulk booking completed");

    } catch (err: any) {
      setLoading(false);
      toast.error("Network error: " + err.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Bulk Booking (DTDC)</h1>

      <Card className="mb-6">
        <CardContent className="space-y-4 py-6">
          <Input type="file" accept=".csv" onChange={handleCSVUpload} />
          <Button onClick={submit} disabled={loading || !rows.length}>
            {loading ? "Processing..." : "Submit Bulk Booking"}
          </Button>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <h2 className="font-semibold mb-3">Preview ({rows.length} rows)</h2>
            <div className="overflow-auto max-h-80 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {Object.keys(rows[0]).map((k) => (
                      <th key={k} className="px-3 py-2 text-left">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b">
                      {Object.values(row).map((v, i2) => (
                        <td key={i2} className="px-3 py-2">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="py-6">
            <h2 className="font-semibold mb-3">Result</h2>
            <pre className="bg-gray-50 p-3 rounded text-sm max-h-96 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}