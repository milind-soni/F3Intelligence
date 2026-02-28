"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import realData from "@/lib/real-data.json";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/demand", label: "Demand Forecast", icon: TrendingUp },
  { href: "/retailers", label: "Retailers & Routes", icon: Users },
  { href: "/risks", label: "Risk Alerts", icon: AlertTriangle },
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
          <p className="text-xs text-sidebar-foreground/60">Delhi NCR</p>
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

      {/* Data stats footer */}
      <div className="border-t border-sidebar-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-sidebar-foreground/60">AI Engine Active</span>
        </div>
        <div className="rounded-lg bg-sidebar-accent/40 p-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Proprietary Data
          </p>
          <div className="flex justify-between">
            <span className="text-xs text-sidebar-foreground/60">Orders</span>
            <span className="text-xs font-semibold text-green-400">
              {(realData.stats.totalOrders / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-sidebar-foreground/60">Retailers</span>
            <span className="text-xs font-semibold text-green-400">
              {realData.stats.uniqueRetailers}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-sidebar-foreground/60">Since</span>
            <span className="text-xs font-semibold text-green-400">Sep 2023</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
