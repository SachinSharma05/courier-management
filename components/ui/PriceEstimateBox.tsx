"use client";

import { useEffect, useState } from "react";

export default function PriceEstimateBox({ form }: { form: any }) {
  const [price, setPrice] = useState<any>(null);

  useEffect(() => {
    const sub = setTimeout(() => {
      calc();
    }, 400); // debounce

    return () => clearTimeout(sub);
  }, [
    form.service_type_id,
    form.weight,
    form.load_type,
    form.origin_pincode,
    form.dest_pincode,
  ]);

  async function calc() {
    if (
      !form.service_type_id ||
      !form.weight ||
      !form.origin_pincode ||
      !form.dest_pincode
    ) {
      setPrice(null);
      return;
    }

    const payload = {
      service_type_id: form.service_type_id,
      load_type: form.load_type,
      weight: form.weight,
      origin_pincode: form.origin_pincode,
      dest_pincode: form.dest_pincode,
    };

    const res = await fetch("/api/pricing/calc", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.ok) setPrice(json);
  }

  return (
    <div className="p-4 border rounded bg-gray-50">
      <div className="font-semibold">Estimated Charge</div>

      {!price && (
        <div className="text-sm text-muted-foreground">
          Enter pin codes & weight…
        </div>
      )}

      {price && (
        <div className="mt-2 space-y-1 text-sm">
          <div>
            Total: <b>₹ {price.total}</b>
          </div>
          <div>Base Price: ₹ {price.base_price}</div>
          <div>Weight Charge: ₹ {price.weight_charge}</div>
          <div>Distance Charge: ₹ {price.distance_charge}</div>

          {!!price.non_doc_surcharge && (
            <div>Non-doc Surcharge: ₹ {price.non_doc_surcharge}</div>
          )}

          <div className="text-xs text-muted-foreground">
            Approx Distance: {price.km_estimated} km
          </div>
        </div>
      )}
    </div>
  );
}
