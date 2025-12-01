import Link from "next/link";

export default function PricingDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pricing Management (DTDC)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Link href="/admin/dtdc/settings/weight-slabs">
          <div className="border p-5 rounded-lg hover:bg-gray-50 space-y-1">
            <h2 className="text-lg font-semibold">Weight Slabs</h2>
            <p className="text-muted-foreground text-sm">
              Manage weight-based charge slabs.
            </p>
          </div>
        </Link>

        <Link href="/admin/dtdc/settings/services">
          <div className="border p-5 rounded-lg hover:bg-gray-50 space-y-1">
            <h2 className="text-lg font-semibold">Service Types</h2>
            <p className="text-muted-foreground text-sm">
              Base prices for STANDARD, PRIORITY etc.
            </p>
          </div>
        </Link>

        <Link href="/admin/dtdc/settings/distance-slabs">
          <div className="border p-5 rounded-lg hover:bg-gray-50 space-y-1">
            <h2 className="text-lg font-semibold">Distance Slabs</h2>
            <p className="text-muted-foreground text-sm">
              Charges based on distance (KM slabs).
            </p>
          </div>
        </Link>

        <Link href="/admin/dtdc/settings/surcharges">
          <div className="border p-5 rounded-lg hover:bg-gray-50 space-y-1">
            <h2 className="text-lg font-semibold">Surcharges</h2>
            <p className="text-muted-foreground text-sm">
              Non-document or special charges.
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}
