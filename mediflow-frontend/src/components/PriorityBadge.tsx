import type { NivelPrioridad } from "../types/mediflow";

export default function PriorityBadge({ nivel }: { nivel: NivelPrioridad }) {
  const isUrgente = nivel === "Urgente";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
        isUrgente ? "bg-urgent/10 text-urgent" : "bg-ok/10 text-ok"
      }`}
    >
      {nivel}
    </span>
  );
}
