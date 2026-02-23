import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change: number;
  period: string;
  icon: LucideIcon;
  color?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  change,
  period,
  icon: Icon,
  color = "bg-green-500",
}: KpiCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {unit && (
                <span className="text-lg text-muted-foreground">{unit}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-green-600" : "text-red-500"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-muted-foreground">{period}</span>
            </div>
          </div>
          <div className={cn("rounded-xl p-3", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
