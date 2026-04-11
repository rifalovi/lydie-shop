import { TrendingUp, TrendingDown } from "lucide-react";
import { cx } from "@/lib/format";

export function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: string;
  trend?: number;
  icon: any;
  suffix?: string;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="card-luxe p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-ui font-semibold uppercase tracking-widest text-ink-muted">
            {label}
          </p>
          <p className="mt-2 font-num text-3xl font-bold text-ink">
            {value}
            {suffix && (
              <span className="text-base font-semibold text-ink-muted">
                {suffix}
              </span>
            )}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-rose-soft text-rose-dark">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <p
          className={cx(
            "mt-4 flex items-center gap-1 text-xs font-ui font-semibold",
            up ? "text-emerald-600" : "text-rose-dark",
          )}
        >
          {up ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {up ? "+" : ""}
          {trend}% vs mois dernier
        </p>
      )}
    </div>
  );
}
