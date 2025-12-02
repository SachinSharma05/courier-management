"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

import { generateCustomLabel } from "@/lib/pdf/generateCustomLabel";
import { mergePDFs } from "@/lib/pdf/mergePDFs";

export default function LabelGeneratorPage() {
  const [awb, setAwb] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!awb.trim()) {
      toast.error("Enter AWB");
      return;
    }
    setLoading(true);

    try {
      // 1) fetch DTDC label base64 from server
      const res = await fetch("/api/providers/dtdc/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || "Failed to fetch DTDC label");
        setLoading(false);
        return;
      }
      const dtdcBase64 = json.label_base64;

      // 2) generate custom label pdf bytes (Uint8Array)
      const customBytes = await generateCustomLabel({
        awb,
        company: "VIS Pvt Ltd",
        address: "Indore, MP",
        phone: "+91 9340384339",
        sender: { name: "Sender", phone: "1111111111", pincode: "452001" },
        receiver: { name: "Receiver", phone: "2222222222", pincode: "110001" },
      });

      // 3) merge both PDFs - pass base64 string and Uint8Array
      const merged = await mergePDFs(customBytes, dtdcBase64); // mergePDFs accepts base64 string too

      // 4) download merged PDF
      const blob = new Blob([new Uint8Array(merged)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LABEL_${awb}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Label downloaded");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to generate label");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Generate Label</h1>

      <Card>
        <CardContent className="space-y-4">
          <Input placeholder="Enter AWB" value={awb} onChange={(e) => setAwb(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate + Download"}
            </Button>
            <Button variant="secondary" onClick={() => setAwb("")}>Clear</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
