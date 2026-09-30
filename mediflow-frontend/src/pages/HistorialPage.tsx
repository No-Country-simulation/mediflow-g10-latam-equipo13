import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";
import { listarDocumentos } from "../lib/api";
import type { DocumentoProcesado } from "../types/mediflow";

const etiquetaStatus: Record<string, string> = {
  procesado: "Procesado",
  en_revision: "En revisión",
  error: "Error",
};

export default function HistorialPage() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoProcesado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    listarDocumentos()
      .then(setDocumentos)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo conectar con el backend"))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return documentos;
    return documentos.filter((d) =>
      [
        d.documento_id,
        d.clasificacion.tipo_documento,
        d.clasificacion.especialidad,
        d.datos_extraidos.paciente?.nombre,
        d.decision_enrutamiento.destino_principal,
      ]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(q))
    );
  }, [documentos, busqueda]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-extrabold text-ink">Historial</h1>
      <p className="text-slate-500 text-sm mt-1">Todos los documentos procesados por el agente.</p>

      {error && (
        <div className="mt-4 bg-urgent/5 border border-urgent/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 text-urgent shrink-0" />
          <span className="text-slate-600">No se pudo conectar con el backend ({error}).</span>
        </div>
      )}

      <div className="mt-5 relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por ID, tipo, paciente o destino…"
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {cargando ? (
        <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando historial…
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden mt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-2 font-medium">ID</th>
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium">Tipo</th>
                <th className="px-5 py-2 font-medium">Prioridad</th>
                <th className="px-5 py-2 font-medium">Confianza</th>
                <th className="px-5 py-2 font-medium">Destino</th>
                <th className="px-5 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    {documentos.length === 0
                      ? "Aún no has procesado ningún documento."
                      : "Ningún documento coincide con la búsqueda."}
                  </td>
                </tr>
              )}
              {filtrados.map((d) => (
                <tr
                  key={d.documento_id}
                  onClick={() => navigate(`/documentos/${d.documento_id}`, { state: { documento: d } })}
                  className="border-t border-slate-50 hover:bg-slate-50/70 cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-ink">{d.documento_id}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{d.fecha ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{d.clasificacion.tipo_documento}</td>
                  <td className="px-5 py-3"><PriorityBadge nivel={d.clasificacion.nivel_prioridad} /></td>
                  <td className="px-5 py-3 text-slate-600">
                    {Math.round(d.clasificacion.score_confianza_clasificacion * 100)}%
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-xs font-semibold">
                      {d.decision_enrutamiento.destino_principal}
                    </span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={etiquetaStatus[d.status] ?? d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}