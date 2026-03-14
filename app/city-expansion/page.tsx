"use client";

import { MapPin, Building2, TrendingUp, Users, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const targetCities = [
  { city: "Jaipur", state: "Rajasthan", population: "3.1M", potential: "High", status: "Research", quarter: "Q3 2026" },
  { city: "Lucknow", state: "Uttar Pradesh", population: "3.4M", potential: "High", status: "Research", quarter: "Q3 2026" },
  { city: "Chandigarh", state: "Punjab/Haryana", population: "1.1M", potential: "Medium", status: "Planned", quarter: "Q4 2026" },
  { city: "Agra", state: "Uttar Pradesh", population: "1.7M", potential: "Medium", status: "Planned", quarter: "Q4 2026" },
  { city: "Meerut", state: "Uttar Pradesh", population: "1.5M", potential: "Medium", status: "Planned", quarter: "Q1 2027" },
];

const expansionPhases = [
  {
    phase: "Market Research",
    description: "Demand mapping, retailer density analysis, competitor landscape",
    status: "In Progress",
    color: "bg-blue-500",
    bgColor: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
  },
  {
    phase: "Hub Selection",
    description: "Identify optimal warehouse/hub locations in target cities",
    status: "Pending",
    color: "bg-amber-500",
    bgColor: "bg-amber-50 border-amber-200",
    textColor: "text-amber-700",
  },
  {
    phase: "Retailer Onboarding",
    description: "Partner with local retailers, set up delivery routes",
    status: "Pending",
    color: "bg-violet-500",
    bgColor: "bg-violet-50 border-violet-200",
    textColor: "text-violet-700",
  },
  {
    phase: "Go Live",
    description: "Full operations launch with monitoring and optimization",
    status: "Pending",
    color: "bg-green-500",
    bgColor: "bg-green-50 border-green-200",
    textColor: "text-green-700",
  },
];

const metrics = [
  { label: "Target Cities", value: "5", icon: MapPin, color: "text-violet-600 bg-violet-100" },
  { label: "Est. New Retailers", value: "340+", icon: Building2, color: "text-blue-600 bg-blue-100" },
  { label: "Revenue Potential", value: "₹2.4Cr/mo", icon: TrendingUp, color: "text-green-600 bg-green-100" },
  { label: "Population Reach", value: "10.8M", icon: Users, color: "text-amber-600 bg-amber-100" },
];

export default function CityExpansionPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">City Expansion</h1>
            <span className="inline-flex items-center rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-xs font-bold text-orange-700 uppercase tracking-wider">Phase 3</span>
            <span className="inline-flex items-center rounded-full bg-muted border border-border px-3 py-0.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Coming Soon</span>
          </div>
          <p className="text-sm text-muted-foreground">Strategic expansion beyond Delhi NCR — target city analysis and rollout planning</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-xl font-black text-foreground mt-0.5">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Target cities table */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 border-b border-border/50 bg-accent/30">
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Target Cities
                </h3>
              </div>
              <div className="divide-y divide-border/50">
                {targetCities.map((c) => (
                  <div key={c.city} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40 transition-colors">
                    <div className="p-2 rounded-lg bg-violet-100">
                      <MapPin className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{c.city}</p>
                      <p className="text-xs text-muted-foreground">{c.state}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-semibold text-foreground">{c.population}</p>
                      <p className="text-[10px] text-muted-foreground">Population</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${c.potential === "High" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {c.potential}
                    </span>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{c.status}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{c.quarter}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expansion roadmap */}
        <div>
          <Card className="shadow-sm border-border">
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> Expansion Roadmap
              </h3>
              <div className="space-y-4">
                {expansionPhases.map((phase, i) => (
                  <div key={phase.phase} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${phase.color}`} />
                      {i < expansionPhases.length - 1 && <div className="w-px flex-1 bg-border mt-1.5" />}
                    </div>
                    <div className={`flex-1 rounded-xl border p-3 mb-1 ${phase.bgColor}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-xs font-bold uppercase tracking-wider ${phase.textColor}`}>{phase.phase}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${phase.status === "In Progress" ? "bg-blue-200 text-blue-800" : "bg-muted text-muted-foreground"}`}>{phase.status}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coming soon banner */}
      <Card className="shadow-sm border-orange-200 bg-orange-50/50">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-100">
            <Building2 className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-orange-800 mb-1">Phase 3 — Launching Q3 2026</h3>
            <p className="text-xs text-orange-700/80 leading-relaxed">
              City Expansion is the next strategic phase for PhalNetra. Full analytics, route planning, and demand forecasting for new cities will be available here once operations begin.
            </p>
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-1.5 text-xs font-bold text-orange-700">
            Learn More <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
