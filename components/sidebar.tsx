"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Truck,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/demand", label: "Demand Forecast", icon: TrendingUp },
  { href: "/retailers", label: "Retailers", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Truck },
  { href: "/risks", label: "Risk Alerts", icon: AlertTriangle },
  { href: "/procurement", label: "Procurement", icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <Image
          src="/logo.jpg"
          alt="F3 Logo"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-lg font-bold tracking-tight">F3 Intelligence</h1>
          <p className="text-xs text-sidebar-foreground/60">Fresh from Farm</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-sidebar-foreground/60">
            AI Engine Active
          </span>
        </div>
        <p className="mt-1 text-xs text-sidebar-foreground/40">
          Last sync: 2 min ago
        </p>
      </div>
    </aside>
  );
}
