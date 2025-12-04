"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/billing/invoices/${id}`);
    const json = await res.json();

    setInvoice(json.invoice);
    setItems(json.items ?? []);
    setPayments(json.payments ?? []);
  }

  async function pay() {
    const res = await fetch(`/api/admin/billing/invoices/${id}`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });

    setAmount("");
    load();
  }

  async function downloadPDF() {
    const res = await fetch(`/api/admin/billing/invoices/${id}/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${id}.pdf`;
    link.click();
  }

  useEffect(() => {
    load();
  }, []);

  if (!invoice) return <div>Loading…</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Invoice {id}</h1>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Client:</strong> {invoice.client_id}</p>
          <p><strong>Month:</strong> {invoice.month}</p>
          <p><strong>Total Amount:</strong> ₹{invoice.total_amount}</p>
          <p><strong>Paid:</strong> ₹{invoice.paid_amount}</p>
          <p><strong>Status:</strong> {invoice.status}</p>

          <Button onClick={downloadPDF}>Download PDF</Button>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.map((it: any) => (
            <div key={it.id} className="border p-2 rounded mb-2">
              <div><strong>AWB:</strong> {it.awb}</div>
              <div><strong>Charge:</strong> ₹{it.charge}</div>
              <div><strong>Provider:</strong> {it.provider}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 && <p>No payments yet.</p>}

          {payments.map((p: any) => (
            <div key={p.id} className="border p-2 rounded mb-2">
              ₹{p.amount} — {p.method} — {p.created_at}
            </div>
          ))}

          {/* Pay Form */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button onClick={pay}>Pay</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}