import { Activity } from "lucide-react";

export default function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
        <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="font-extrabold text-[17px] text-ink tracking-tight">MediFlow</div>
        {subtitle && <div className="text-[11px] text-slate-500 -mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
