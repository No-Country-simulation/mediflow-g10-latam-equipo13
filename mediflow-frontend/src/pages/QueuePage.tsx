import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PriorityBadge from "../components/PriorityBadge";
import { listarDocumentos } from "../lib/api";
import type { DocumentoProcesado } from "../types/mediflow";

export default function QueuePage() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoProcesado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarDocumentos()
      .then(setDocumentos)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo conectar con el backend"))
      .finally(() => setCargando(false));
  }, []);

  const colas = documentos.reduce<Record<string, number>>((acc, d) => {
    const destino = d.decision_enrutamiento.destino_principal;
    acc[destino] = (acc[destino] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-extrabold text-ink">Colas de enrutamiento</h1>
      <p className="text-slate-500 text-sm mt-1">Estado actual de la distribución de documentos.</p>

      {error && (
        <div className="mt-4 bg-urgent/5 border border-urgent/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 text-urgent shrink-0" />
          <span className="text-slate-600">No se pudo conectar con el backend ({error}).</span>
        </div>
      )}

      {cargando ? (
        <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando colas…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {Object.entries(colas).length === 0 && (
              <p className="text-slate-400 text-sm col-span-full">Aún no hay documentos en ninguna cola.</p>
            )}
            {Object.entries(colas).map(([nombre, cantidad]) => (
              <div key={nombre} className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
                <p className="text-slate-500 text-[13px] mb-2">{nombre}</p>
                <p className="text-2xl font-extrabold text-ink">{cantidad}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden mt-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-ink text-[15px]">Documentos en cola</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">ID</th>
                  <th className="px-5 py-2 font-medium">Tipo</th>
                  <th className="px-5 py-2 font-medium">Especialidad</th>
                  <th className="px-5 py-2 font-medium">Prioridad</th>
                  <th className="px-5 py-2 font-medium">Destino</th>
                  <th className="px-5 py-2 font-medium">Auditoría</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((d) => (
                  <tr
                    key={d.documento_id}
                    onClick={() => navigate(`/documentos/${d.documento_id}`, { state: { documento: d } })}
                    className="border-t border-slate-50 hover:bg-slate-50/70 cursor-pointer"
                  >
                    <td className="px-5 py-3 font-medium text-ink">{d.documento_id}</td>
                    <td className="px-5 py-3 text-slate-600">{d.clasificacion.tipo_documento}</td>
                    <td className="px-5 py-3 text-slate-600">{d.clasificacion.especialidad}</td>
                    <td className="px-5 py-3"><PriorityBadge nivel={d.clasificacion.nivel_prioridad} /></td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-xs font-semibold">
                        {d.decision_enrutamiento.destino_principal}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {d.decision_enrutamiento.requiere_auditoria_humana ? "Sí" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-ok/10 text-ok flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </span>
        <div>
          <p className="font-semibold text-ink text-sm">El agente autónomo está operando correctamente.</p>
          <p className="text-slate-400 text-xs">En caso de ambigüedad o score de confianza &lt; 0.60, el documento se envía a revisión humana.</p>
        </div>
      </div>
    </div>
  );
}
