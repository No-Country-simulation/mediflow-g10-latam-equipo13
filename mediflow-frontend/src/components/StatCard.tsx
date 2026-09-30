import { ArrowUp, ArrowDown } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
}

export default function StatCard({ icon, label, value, delta, deltaLabel = "vs. ayer" }: StatCardProps) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
      <div className="flex items-center gap-2 text-slate-500 text-[13px] mb-3">
        <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          {icon}
        </span>
        {label}
      </div>
      <div className="text-2xl font-extrabold text-ink tracking-tight">{value}</div>
      {typeof delta === "number" && (
        <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-ok" : "text-urgent"}`}>
          {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(delta)}% {deltaLabel}
        </div>
      )}
    </div>
  );
}
