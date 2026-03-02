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

const navItems = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/demand", label: "Demand Forecast", shortLabel: "Demand", icon: TrendingUp },
  { href: "/retailers", label: "Retailers & Routes", shortLabel: "Map", icon: Users },
  { href: "/risks", label: "Risk Alerts", shortLabel: "Risks", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="fixed left-0 top-0 z-40 hidden lg:flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
          <Image src="/logo.jpg" alt="F3 Logo" width={40} height={40} className="rounded-lg" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">F3 Intelligence</h1>
            <p className="text-xs text-sidebar-foreground/60">Delhi NCR</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-sidebar text-sidebar-foreground px-4 h-14 border-b border-sidebar-border">
        <Image src="/logo.jpg" alt="F3 Logo" width={28} height={28} className="rounded-md shrink-0" />
        <div>
          <p className="text-sm font-bold leading-none">F3 Intelligence</p>
          <p className="text-[10px] text-sidebar-foreground/55 mt-0.5">Delhi NCR · Fresh Produce AI</p>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 transition-colors"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-green-400" />
              )}
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                active ? "text-green-400" : "text-sidebar-foreground/45"
              )} />
              <span className={cn(
                "text-[10px] font-semibold transition-colors",
                active ? "text-green-400" : "text-sidebar-foreground/45"
              )}>
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
