// components/layout/ClientShell.tsx

import ClientSidebar from "@/components/client/Sidebar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ClientSidebar />
      <main className="flex-1 ml-16 md:ml-60 p-6">
        {children}
      </main>
    </div>
  );
}
