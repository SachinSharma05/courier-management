import ClientShell from "@/components/layout/ClientShell";
import { getServerSession } from "@/lib/auth/getServerSession";
import { redirect } from "next/navigation";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session.ok) redirect("/auth/login");
  if (session.user.role !== "client") redirect("/admin");

  return <ClientShell>{children}</ClientShell>;
}
