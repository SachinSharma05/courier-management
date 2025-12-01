// app/client/settings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(j => setProfile(j.user));
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      {profile ? (
        <div className="space-y-2">
          <div>Username: {profile.username}</div>
          <div>Role: {profile.role}</div>
          <Button onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/auth/login"); }}>Logout</Button>
        </div>
      ) : <div>Loading…</div>}
    </div>
  );
}
