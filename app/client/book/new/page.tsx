// app/client/book/new/page.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

import PincodeAutocomplete from "@/components/ui/PincodeAutoComplete";
import PriceEstimateBox from "@/components/ui/PriceEstimateBox";
import InvoiceBreakdown from "@/components/ui/InvoiceBreakdown";
import { useRouter } from "next/navigation";

export default function SingleBookingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);

  const [form, setForm] = useState({
    reference_number: "",
    service_type_id: "STANDARD",
    load_type: "DOCUMENT",
    weight: "1",

    origin_name: "",
    origin_phone: "",
    origin_pincode: "",
    origin_city: "",
    origin_state: "",

    dest_name: "",
    dest_phone: "",
    dest_pincode: "",
    dest_city: "",
    dest_state: "",

    length: "",
    width: "",
    height: "",
  });

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);

    const consignment: any = {
      reference_number: form.reference_number || `AUTO-${Date.now()}`,
      service_type_id: form.service_type_id,
      load_type: form.load_type,
      weight: Number(form.weight),
      weight_unit: "kg",

      origin_details: {
        name: form.origin_name,
        phone: form.origin_phone,
        pincode: form.origin_pincode,
      },

      destination_details: {
        name: form.dest_name,
        phone: form.dest_phone,
        pincode: form.dest_pincode,
      },
    };

    if (form.load_type === "NON-DOCUMENT") {
      consignment.dimension_unit = "cm";
      consignment.length = Number(form.length);
      consignment.width = Number(form.width);
      consignment.height = Number(form.height);
    }

    const res = await fetch("/api/providers/dtdc/book", {
      method: "POST",
      body: JSON.stringify({ consignments: [consignment] }),
    });

    const json = await res.json();
    setLoading(false);

    if (!json.ok) {
      toast.error(json.error || "Booking failed");
      return;
    }

    const dtdcResult = json.result?.data?.[0];

    setConfirmation({
      awb: json.awb,
      pricing: json.pricing,
      result: dtdcResult,
    });

    if (dtdcResult?.success) {
      toast.success("Booking successful! AWB: " + dtdcResult.reference_number);
    } else {
      toast.error(dtdcResult?.message ?? "Booking failed");
    }
  }

  // -------------------------
  // SHOW CONFIRMATION SCREEN
  // -------------------------
  if (confirmation) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-8">

        <h1 className="text-2xl font-semibold text-green-600">Booking Successful</h1>

        <InvoiceBreakdown awb={confirmation.awb} pricing={confirmation.pricing} />

        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>New Booking</Button>
          <Button
            variant="outline"
            onClick={() => router.push("/client/track")}
          >
            Track AWB
          </Button>
        </div>

      </div>
    );
  }

  // -------------------------
  // MAIN BOOKING FORM
  // -------------------------
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Create New Booking</h1>

      <Card>
        <CardContent className="p-6">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={submit}>

            {/* LEFT SIDE */}
            <div className="space-y-4">

              <Input
                placeholder="Reference Number (optional)"
                onChange={(e) => update("reference_number", e.target.value)}
              />

              <div>
                <label>Service Type</label>
                <Select defaultValue="STANDARD" onValueChange={(v) => update("service_type_id", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PRIORITY">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label>Load Type</label>
                <Select defaultValue="DOCUMENT" onValueChange={(v) => update("load_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="NON-DOCUMENT">Non Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label>Weight (kg)</label>
                <Input
                  type="number"
                  defaultValue="1"
                  onChange={(e) => update("weight", e.target.value)}
                />
              </div>

              {form.load_type === "NON-DOCUMENT" && (
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Length" onChange={(e) => update("length", e.target.value)} />
                  <Input placeholder="Width" onChange={(e) => update("width", e.target.value)} />
                  <Input placeholder="Height" onChange={(e) => update("height", e.target.value)} />
                </div>
              )}

              {/* PRICE BOX */}
              <PriceEstimateBox form={form} />
            </div>

            {/* RIGHT SIDE */}
            <div className="space-y-6">

              <div className="space-y-2 p-4 border rounded">
                <h3 className="font-semibold">Sender</h3>
                <Input placeholder="Name" onChange={(e) => update("origin_name", e.target.value)} />
                <Input placeholder="Phone" onChange={(e) => update("origin_phone", e.target.value)} />

                <PincodeAutocomplete
                  value={form.origin_pincode}
                  onSelect={(p) => {
                    update("origin_pincode", p.pincode);
                    update("origin_city", p.district);
                    update("origin_state", p.state);
                  }}
                />
              </div>

              <div className="space-y-2 p-4 border rounded">
                <h3 className="font-semibold">Receiver</h3>
                <Input placeholder="Name" onChange={(e) => update("dest_name", e.target.value)} />
                <Input placeholder="Phone" onChange={(e) => update("dest_phone", e.target.value)} />

                <PincodeAutocomplete
                  value={form.dest_pincode}
                  onSelect={(p) => {
                    update("dest_pincode", p.pincode);
                    update("dest_city", p.district);
                    update("dest_state", p.state);
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Booking..." : "Create Booking"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
