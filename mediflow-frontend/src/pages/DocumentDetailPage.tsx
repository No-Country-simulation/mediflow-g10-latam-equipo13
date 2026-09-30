import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { obtenerDocumento } from "../lib/api";
import type { DocumentoProcesado } from "../types/mediflow";

const tabs = ["Documento", "Datos extraídos", "Decisión de enrutamiento"] as const;

export default function DocumentDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const documentoDesdeNavegacion = (location.state as { documento?: DocumentoProcesado } | null)?.documento;

  const [doc, setDoc] = useState<DocumentoProcesado | null>(documentoDesdeNavegacion ?? null);
  const [cargando, setCargando] = useState(!documentoDesdeNavegacion);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Documento");

  useEffect(() => {
    if (documentoDesdeNavegacion || !id) return;
    setCargando(true);
    obtenerDocumento(id)
      .then(setDoc)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el documento"))
      .finally(() => setCargando(false));
  }, [id, documentoDesdeNavegacion]);

  if (cargando) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando documento…
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-6 flex items-center gap-2 text-urgent">
        <AlertCircle className="w-4 h-4" /> {error ?? "Documento no encontrado"}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Detalle del documento</h1>
          <p className="text-slate-400 text-sm">ID {doc.documento_id} · {doc.fecha}</p>
        </div>
        <StatusBadge status={doc.status === "en_revision" ? "En revisión" : "Procesado"} />
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-100">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-semibold ${
              tab === t ? "text-brand-600 border-b-2 border-brand-500" : "text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Documento" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 text-center text-slate-400 text-sm">
          Vista previa del archivo original (pendiente de integrar visor de PDF/imagen).
        </div>
      )}

      {tab === "Datos extraídos" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 max-w-md">
          <p className="font-bold text-ink text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" /> Datos extraídos
          </p>
          <div className="space-y-3 text-[13px]">
            <div>
              <p className="text-slate-400 text-xs">Paciente</p>
              <p className="text-ink font-medium">{doc.datos_extraidos.paciente.nombre}</p>
              <p className="text-slate-500 text-xs">RUT {doc.datos_extraidos.paciente.rut} · {doc.datos_extraidos.paciente.edad} años</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Médico solicitante</p>
              <p className="text-ink font-medium">{doc.datos_extraidos.medico_solicitante.nombre}</p>
              <p className="text-slate-500 text-xs">Matrícula {doc.datos_extraidos.medico_solicitante.matricula}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Estudio realizado</p>
              <p className="text-ink">{doc.datos_extraidos.estudio_realizado}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Diagnóstico principal / CIE-10</p>
              <p className="text-ink">{doc.datos_extraidos.diagnostico_principal} · {doc.datos_extraidos.cie10_sugerido}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "Decisión de enrutamiento" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 max-w-md space-y-3 text-[13px]">
          <div>
            <p className="text-slate-400 text-xs">Destino principal</p>
            <p className="text-ink font-medium">{doc.decision_enrutamiento.destino_principal}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Requiere auditoría humana</p>
            <p className="text-ink font-medium">{doc.decision_enrutamiento.requiere_auditoria_humana ? "Sí" : "No"}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Justificación</p>
            <p className="text-ink">{doc.decision_enrutamiento.justificacion_enrutamiento}</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-slate-400 text-xs">Almacenamiento OCI</p>
            <p className="text-ink text-xs font-mono">{doc.almacenamiento_oci.bucket}/{doc.almacenamiento_oci.ruta_objeto}</p>
          </div>
        </div>
      )}
    </div>
  );
}
