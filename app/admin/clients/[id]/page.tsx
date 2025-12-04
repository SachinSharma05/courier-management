import { db } from "@/lib/db/postgres";
import {
  users,
  clientCredentials,
  consignments
} from "@/db/schema";

import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import SyncNowButton from "@/components/SyncNowButton";

export default async function ClientDashboard({ params }: any) {
  const id = Number((await params).id);

  const client = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (client.length === 0) return notFound();
  const c = client[0];

  const creds = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, id));

  const providersConfigured = [...new Set(creds.map((k) => k.provider_id))];

  const stats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      delivered: sql<number>`
        SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%deliver%' THEN 1 ELSE 0 END)
      `,
      rto: sql<number>`
        SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%rto%' THEN 1 ELSE 0 END)
      `,
      pending: sql<number>`
        SUM(
          CASE 
            WHEN LOWER(${consignments.lastStatus}) NOT LIKE '%deliver%'
            AND LOWER(${consignments.lastStatus}) NOT LIKE '%rto%'
            THEN 1 ELSE 0 END
        )
      `,
    })
    .from(consignments)
    .where(eq(consignments.client_id, id));

  const analytics = stats[0] ?? {
    total: 0,
    delivered: 0,
    pending: 0,
    rto: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{c.company_name}</h1>
        <p className="text-gray-500 mt-1">
          Client ID: {c.id} · {c.email}
        </p>
      </div>

      {/* Small Cards Row (5 cards side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

        {/* PROVIDERS */}
        <Card className="p-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Providers</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <div className="flex flex-wrap gap-1">
              {providersConfigured.length === 0 && (
                <span className="text-xs text-gray-400">None</span>
              )}

              {providersConfigured.includes(1) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">DTDC</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold py-2">
            {analytics.total}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Delivered</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600 py-2">
            {analytics.delivered}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-blue-600 py-2">
            {analytics.pending}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">RTO</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600 py-2">
            {analytics.rto}
          </CardContent>
        </Card>

      </div>

      {/* TABS */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="track">Track</TabsTrigger>
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="bulk">Bulk</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Client Overview</CardTitle>
              <div className="ml-auto">
                <SyncNowButton clientId={id} />
                </div>
            </CardHeader>
            <CardContent>
              This will later include latest shipments, AWB usage, and activities.
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRACK */}
        <TabsContent value="track">
          <Card>
            <CardHeader><CardTitle>Track Consignment</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/admin/clients/${id}/track`} className="text-blue-600 underline">
                Open Track Page →
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOOK */}
        <TabsContent value="book">
          <Card>
            <CardHeader><CardTitle>Book Shipment</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/admin/clients/${id}/book`} className="text-blue-600 underline">
                Book Shipment →
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BULK */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader><CardTitle>Bulk Booking</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/admin/clients/${id}/bulk`} className="text-blue-600 underline">
                Bulk Booking Upload →
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports">
          <Card>
            <CardHeader><CardTitle>Download Reports</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/admin/clients/${id}/reports`} className="text-blue-600 underline">
                Reports & Exports →
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CREDENTIALS */}
        <TabsContent value="credentials">
          <Card>
            <CardHeader><CardTitle>Credentials</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/admin/clients/${id}/credentials`} className="text-blue-600 underline">
                Manage Provider Credentials →
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
