import Link from "next/link";
import { db } from "@/lib/db/postgres";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pencil, KeyRound } from "lucide-react";

export default async function ClientsPage() {
  const rows = await db.select().from(users).where(eq(users.role, "client"));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>

        <Link
          href="/admin/clients/new"
          className="px-5 py-2.5 bg-black text-white rounded-lg shadow hover:bg-gray-900 transition"
        >
          + Add Client
        </Link>
      </div>

      {/* Client List */}
      <div className="grid gap-4">
        {rows.map((c) => (
          <div
            key={c.id}
            className="group border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition flex justify-between items-center"
          >
            {/* Left: Client Info */}
            <div>
              <div className="font-semibold text-lg group-hover:text-black/90">
                {c.company_name || c.username}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{c.email}</div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/admin/clients/${c.id}/edit`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Pencil size={16} /> Edit
              </Link>

              <Link
                href={`/admin/clients/${c.id}/credentials`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <KeyRound size={16} /> Credentials
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
