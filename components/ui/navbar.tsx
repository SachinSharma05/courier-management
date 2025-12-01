"use client";

import { useEffect, useState } from "react";
import { Menu, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import Sidebar from "@/components/admin/Sidebar";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => j.ok && setUser(j.user));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return (
    <header className="h-16 border-b bg-white sticky top-0 z-50">
      <div className="h-full flex items-center justify-between px-5">

        {/* Sidebar toggle (mobile) */}
        <Sheet>
          <SheetTrigger className="md:hidden">
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Brand */}
        <Link href="/" className="font-semibold text-xl tracking-wide">
          Admin
        </Link>

        {/* User Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem disabled className="opacity-80">
                <User className="mr-2 w-4 h-4" /> {user.username}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
