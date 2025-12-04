"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [searchClient, setSearchClient] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function load() {
    const qp = new URLSearchParams();
    qp.set("page", String(page));
    qp.set("pageSize", "20");
    if (searchClient) qp.set("clientId", searchClient);
    if (status) qp.set("status", status);

    const res = await fetch(`/api/admin/billing/invoices?${qp.toString()}`);
    const json = await res.json();

    setInvoices(json.items ?? []);
    setTotal(json.total ?? 0);
  }

  useEffect(() => {
    load();
  }, [page, status]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Billing & Invoices</h1>
        <Link href="/admin/billing/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="Search by Client ID"
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>

          <Button onClick={() => load()}>Search</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.id}</TableCell>
                  <TableCell>{inv.client_id}</TableCell>
                  <TableCell>{inv.month}</TableCell>
                  <TableCell>₹{inv.total_amount}</TableCell>
                  <TableCell>₹{inv.paid_amount}</TableCell>
                  <TableCell>{inv.status}</TableCell>
                  <TableCell>
                    <Link href={`/admin/billing/invoices/${inv.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Prev
            </Button>

            <Button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}