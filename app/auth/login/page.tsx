// app/auth/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.ok) {
      toast.success("Logged in");
      router.push("/client");
    } else {
      toast.error(json.error || "Login failed");
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h2 className="text-2xl font-semibold mb-6">Login</h2>
      <form onSubmit={submit} className="space-y-4">
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
