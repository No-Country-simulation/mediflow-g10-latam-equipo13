export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Procesado": "bg-ok/10 text-ok",
    "En revisión": "bg-warn/10 text-warn",
    "Error": "bg-urgent/10 text-urgent",
  };
  const cls = map[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
