interface InvoiceBreakdownProps {
  awb: string;
  pricing: any; // or a proper type if you have it
}

export default function InvoiceBreakdown({ awb, pricing }: InvoiceBreakdownProps) {
  if (!pricing) return null;

  return (
    <div className="border p-6 rounded-lg space-y-4 bg-white shadow-sm">
      <h2 className="text-xl font-semibold">Invoice Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>AWB Number:</span>
          <span className="font-medium">{awb}</span>
        </div>

        <div className="flex justify-between">
          <span>Base Price:</span>
          <span>₹ {pricing.base_price}</span>
        </div>

        <div className="flex justify-between">
          <span>Weight Charge:</span>
          <span>₹ {pricing.weight_charge}</span>
        </div>

        <div className="flex justify-between">
          <span>Distance Charge:</span>
          <span>₹ {pricing.distance_charge}</span>
        </div>

        {pricing.non_doc_surcharge > 0 && (
          <div className="flex justify-between">
            <span>Non-Document Surcharge:</span>
            <span>₹ {pricing.non_doc_surcharge}</span>
          </div>
        )}

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Estimated Distance:</span>
          <span>{pricing.km_estimated} km</span>
        </div>

        <div className="border-t my-2"></div>

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>₹ {pricing.total}</span>
        </div>
      </div>
    </div>
  );
}
