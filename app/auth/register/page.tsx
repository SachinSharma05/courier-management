// app/auth/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", company_name: "", contact_person: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (json.ok) {
      toast.success("Registered");
      router.push("/auth/login");
    } else {
      toast.error(json.error || "Registration failed");
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h2 className="text-2xl font-semibold mb-6">Register</h2>
      <form onSubmit={submit} className="space-y-4">
        <Input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Input placeholder="Contact person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}
