import { useEffect, useState } from "react";
import { FileCheck2, ShieldAlert, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { listarDocumentos } from "../lib/api";
import type { DocumentoProcesado } from "../types/mediflow";

export default function DashboardPage() {
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

  const enRevision = documentos.filter((d) => d.status === "en_revision").length;
  const procesados = documentos.filter((d) => d.status === "procesado").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Hola, Cristian 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Aquí tienes un resumen del estado del sistema.</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-urgent/5 border border-urgent/20 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 text-urgent shrink-0" />
          <span className="text-slate-600">
            No se pudo conectar con el backend ({error}). Verifica que esté corriendo en el puerto configurado en <code className="font-mono text-xs">VITE_API_BASE_URL</code>.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<FileCheck2 className="w-4 h-4" />} label="Documentos procesados" value={documentos.length} />
        <StatCard icon={<ShieldAlert className="w-4 h-4" />} label="En revisión humana" value={enRevision} />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Enrutados correctamente" value={procesados} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-ink text-[15px]">Documentos procesados</h2>
        </div>

        {cargando ? (
          <div className="p-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando documentos…
          </div>
        ) : documentos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aún no hay documentos procesados. Sube uno desde "Procesar documento".
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-2 font-medium">ID Documento</th>
                <th className="px-5 py-2 font-medium">Tipo</th>
                <th className="px-5 py-2 font-medium">Especialidad</th>
                <th className="px-5 py-2 font-medium">Prioridad</th>
                <th className="px-5 py-2 font-medium">Estado</th>
                <th className="px-5 py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => (
                <tr
                  key={doc.documento_id}
                  onClick={() => navigate(`/documentos/${doc.documento_id}`, { state: { documento: doc } })}
                  className="border-t border-slate-50 hover:bg-slate-50/70 cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-ink">{doc.documento_id}</td>
                  <td className="px-5 py-3 text-slate-600">{doc.clasificacion.tipo_documento}</td>
                  <td className="px-5 py-3 text-slate-600">{doc.clasificacion.especialidad}</td>
                  <td className="px-5 py-3"><PriorityBadge nivel={doc.clasificacion.nivel_prioridad} /></td>
                  <td className="px-5 py-3"><StatusBadge status={doc.status === "en_revision" ? "En revisión" : "Procesado"} /></td>
                  <td className="px-5 py-3 text-slate-400">{doc.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
