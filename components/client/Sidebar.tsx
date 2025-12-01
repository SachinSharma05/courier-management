"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  Package,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClientSidebar() {
  const router = useRouter();

  const [providers, setProviders] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sidebarOpen = hovering || !collapsed;

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/client/providers");
      const json = await res.json();
      setProviders(json.providers || []);
    }
    load();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <aside
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`
        h-screen fixed left-0 top-0 bg-white border-r shadow-sm z-40
        transition-all duration-300 flex flex-col
        ${sidebarOpen ? "w-60" : "w-16"}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b">
        {sidebarOpen && <span className="font-semibold">Client</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-gray-100 rounded">
          <Menu size={18} />
        </button>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto p-2">
        <SidebarItem href="/client" label="Dashboard" icon={<Home size={18} />} sidebarOpen={sidebarOpen} />

        {providers.map((p) => (
          <SidebarSection
            key={p}
            title={p.toUpperCase()}
            open={openSection === p}
            toggle={() => setOpenSection(openSection === p ? null : p)}
            sidebarOpen={sidebarOpen}
            icon={<Package size={18} />}
          >
            <SidebarLink href={`/client/${p}/new-booking`} label="New Booking" />
            <SidebarLink href={`/client/${p}/bulk-booking`} label="Bulk Booking" />
            <SidebarLink href={`/client/${p}/track`} label="Track Consignment" />
          </SidebarSection>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="p-4 border-t">
        <button onClick={logout} className="flex items-center gap-3 text-red-600 hover:bg-red-50 p-2 rounded w-full">
          <LogOut size={18} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ href, label, icon, sidebarOpen }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
    >
      {icon}
      {sidebarOpen && <span>{label}</span>}
    </Link>
  );
}

function SidebarSection({
  title,
  open,
  toggle,
  icon,
  sidebarOpen,
  children,
}: any) {
  return (
    <div className="mb-2">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          {icon}
          {sidebarOpen && <span className="font-medium">{title}</span>}
        </div>

        {sidebarOpen && (open ? <ChevronDown /> : <ChevronRight />)}
      </button>

      {open && sidebarOpen && <div className="ml-6 mt-1 space-y-1">{children}</div>}
    </div>
  );
}

function SidebarLink({ href, label }: any) {
  return (
    <Link
      href={href}
      className="block p-2 rounded text-sm hover:bg-gray-100"
    >
      {label}
    </Link>
  );
}
