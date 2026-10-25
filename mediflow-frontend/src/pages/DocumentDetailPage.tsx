import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Download,
  Code2,
  Shield,
  ShieldCheck,
  Brain,
  Route as RouteIcon,
  Database,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Bell,
  Pill,
} from 'lucide-react';
import { Badge, Button, Card, Modal, Tabs } from '../components/ui';
import { mensajeError, obtenerDocumentoUnificado, useAuth, type DocumentoUnificado } from '../lib/api';
import { cargarConfig } from '../lib/triageConfig';
import { descargarArchivo } from '../lib/exportar';
import TrazaAgente from '../components/TrazaAgente';
import GrafoAgente, { rutaDeDocumento, type RutaAgente } from '../components/GrafoAgente';
import { cn } from '../lib/design-system';

const RUTA_META: Record<RutaAgente, { nombre: string; punto: string }> = {
  estandar: { nombre: 'Flujo estándar', punto: 'bg-success-500' },
  urgencia: { nombre: 'Emergencias', punto: 'bg-danger-500' },
  revision_humana: { nombre: 'Revisión humana', punto: 'bg-warning-500' },
};

function AnilloConfianza({ valor, umbral }: { valor: number; umbral: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const color = valor >= 0.8 ? '#24e0c4' : valor >= umbral ? '#f79009' : '#f04438';
  return (
    <div className="relative w-[112px] h-[112px] shrink-0" title="Estimación del modelo de IA, no una probabilidad exacta">
      <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - valor)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.65,.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="kpi-number text-[22px] font-bold text-white leading-none">{Math.round(valor * 100)}%</span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">confianza</span>
      </div>
    </div>
  );
}

const decisionLabel = {
  aprobado: { label: 'Aprobado', variant: 'success' as const },
  corregido: { label: 'Corregido y aprobado', variant: 'warning' as const },
  rechazado: { label: 'Rechazado', variant: 'danger' as const },
};

function Dato({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className={`text-sm font-medium text-neutral-900 mt-0.5 ${mono ? 'font-mono' : ''}`}>{children || '—'}</dd>
    </div>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const desdeNavegacion = (location.state as { documento?: DocumentoUnificado } | null)?.documento;

  const [doc, setDoc] = useState<DocumentoUnificado | null>(desdeNavegacion ?? null);
  const [cargando, setCargando] = useState(!desdeNavegacion);
  const [error, setError] = useState<string | null>(null);
  const [verJson, setVerJson] = useState(false);
  const umbral = cargarConfig().umbralConfianza;

  useEffect(() => {
    if (desdeNavegacion || !id) return;
    let vivo = true;
    setCargando(true);
    obtenerDocumentoUnificado(id)
      .then((d) => vivo && setDoc(d))
      .catch((e) => vivo && setError(mensajeError(e, 'No se pudo cargar el documento')))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [id, desdeNavegacion]);

  if (cargando) {
    return (
      <div className="p-6 flex items-center gap-2 text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando documento…
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-10 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-danger-500" />
        <h2 className="text-lg font-semibold text-neutral-900">No se pudo cargar</h2>
        <p className="text-neutral-500 max-w-md">{error ?? 'Documento no encontrado'}</p>
        <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ChevronLeft className="w-4 h-4" />}>
          Volver
        </Button>
      </div>
    );
  }

  const scorePct = Math.round(doc.scoreConfianza * 100);
  const puedeAuditar = !user || user.rol === 'ADMIN' || user.rol === 'AUDITOR';
  const pendiente = !doc.revision && (doc.requiereAuditoria || doc.status === 'en_revision');

  const estado = pendiente
    ? { variant: 'warning' as const, Icon: AlertTriangle, label: 'En revisión' }
    : doc.status === 'error' || doc.revision?.decision === 'rechazado'
    ? { variant: 'danger' as const, Icon: XCircle, label: doc.revision ? 'Rechazado' : 'Error' }
    : { variant: 'success' as const, Icon: CheckCircle2, label: doc.revision ? 'Revisado' : 'Procesado' };

  const descargar = () =>
    descargarArchivo(`documento-${doc.documentoId}.json`, JSON.stringify(doc, null, 2), 'application/json');

  const tabs = [
    {
      id: 'agente',
      label: 'Decisión del agente',
      icon: <Brain className="w-4 h-4" />,
      content: (
        <Card variant="default" padding="lg">
          <h3 className="font-bold text-neutral-900 mb-1 flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-500" /> Cómo decidió el agente
          </h3>
          <p className="text-sm text-neutral-500 mb-5">
            Cada paso del grafo de decisión, con lo que observó y el motivo de la ruta elegida.
          </p>
          <TrazaAgente traza={doc.traza} validacion={doc.validacion} />
        </Card>
      ),
    },
    {
      id: 'datos',
      label: 'Datos extraídos',
      icon: <Database className="w-4 h-4" />,
      content: (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card variant="default" padding="lg">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Paciente
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Dato label="Nombre">{doc.paciente.nombre}</Dato></div>
              <Dato label="RUT" mono>{doc.paciente.rut}</Dato>
              <Dato label="Edad">{doc.paciente.edad != null ? `${doc.paciente.edad} años` : ''}</Dato>
            </dl>
          </Card>

          <Card variant="default" padding="lg">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Médico solicitante
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Dato label="Nombre">{doc.medico.nombre}</Dato></div>
              <Dato label="Matrícula">{doc.medico.matricula}</Dato>
            </dl>
          </Card>

          <Card variant="default" padding="lg" className="lg:col-span-2">
            <h3 className="font-bold text-neutral-900 mb-4">Datos clínicos</h3>
            <dl className="grid sm:grid-cols-2 gap-4">
              <Dato label="Estudio realizado">{doc.estudioRealizado}</Dato>
              <Dato label="Diagnóstico principal">{doc.diagnosticoPrincipal}</Dato>
              <Dato label="CIE-10 sugerido" mono>{doc.cie10Sugerido}</Dato>
            </dl>
          </Card>

          {doc.medicamentos.length > 0 && (
            <Card variant="default" padding="lg" className="lg:col-span-2">
              <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-brand-500" /> Medicamentos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                      <th className="py-2 pr-4 font-medium">Medicamento</th>
                      <th className="py-2 pr-4 font-medium">Dosis</th>
                      <th className="py-2 pr-4 font-medium">Frecuencia</th>
                      <th className="py-2 pr-4 font-medium">Vía</th>
                      <th className="py-2 font-medium">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.medicamentos.map((m, i) => (
                      <tr key={i} className="border-t border-neutral-100">
                        <td className="py-2 pr-4 font-semibold text-neutral-900">{m.nombre}</td>
                        <td className="py-2 pr-4">{m.dosis || '—'}</td>
                        <td className="py-2 pr-4">{m.frecuencia || '—'}</td>
                        <td className="py-2 pr-4">{m.via || '—'}</td>
                        <td className="py-2">{m.duracion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'enrutamiento',
      label: 'Enrutamiento',
      icon: <RouteIcon className="w-4 h-4" />,
      content: (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card variant="default" padding="lg">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-brand-500" /> Decisión de enrutamiento
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-neutral-500">Destino principal</dt>
                <dd className="font-bold text-brand-600 text-lg mt-0.5">{doc.destino || 'Sin destino asignado'}</dd>
              </div>
              <div className="flex items-center gap-3">
                <dt className="text-sm text-neutral-500">Requiere auditoría humana</dt>
                <dd>
                  <Badge variant={doc.requiereAuditoria ? 'warning' : 'success'} dot>{doc.requiereAuditoria ? 'Sí' : 'No'}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Justificación</dt>
                <dd className="mt-1 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-700">{doc.justificacion || '—'}</dd>
              </div>
            </dl>
            {doc.notificacion && (
              <div className="mt-4 flex items-start gap-2 text-sm bg-danger-50 border border-danger-200 rounded-lg p-3 text-danger-800">
                <Bell className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{doc.notificacion.canal}</p>
                  <p>{doc.notificacion.mensaje}</p>
                </div>
              </div>
            )}
          </Card>

          <Card variant="default" padding="lg">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-500" /> Almacenamiento OCI
            </h3>
            {doc.almacenamiento.bucket || doc.almacenamiento.ruta ? (
              <dl className="space-y-3 text-sm font-mono">
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Bucket</dt><dd className="text-neutral-900">{doc.almacenamiento.bucket || '—'}</dd></div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Ruta</dt>
                  <dd className="text-neutral-900 truncate max-w-[240px]" title={doc.almacenamiento.ruta}>{doc.almacenamiento.ruta || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <dt className="text-neutral-500">Backup</dt>
                  <dd><Badge variant={doc.almacenamiento.status === 'exito' ? 'success' : 'warning'} dot>{doc.almacenamiento.status || 'sin dato'}</Badge></dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-neutral-500">
                {doc.almacenamiento.status === 'omitido'
                  ? 'OCI no está configurado en este entorno: el resultado se guardó solo en la base de datos.'
                  : 'Este registro no tiene datos de almacenamiento en OCI.'}
              </p>
            )}
          </Card>
        </div>
      ),
    },
    {
      id: 'auditoria',
      label: 'Auditoría',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <Card variant="default" padding="lg">
          <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" /> Registro de auditoría
          </h3>
          <div className="space-y-3 text-sm">
            {doc.revision ? (
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900">
                    {decisionLabel[doc.revision.decision].label}
                    {doc.revision.revisor ? ` por ${doc.revision.revisor}` : ''}
                  </p>
                  <p className="text-xs text-neutral-500">{new Date(doc.revision.fecha).toLocaleString('es-CO')}</p>
                  {doc.revision.comentario && <p className="mt-2 text-neutral-700">{doc.revision.comentario}</p>}
                </div>
              </div>
            ) : pendiente ? (
              <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
                <AlertTriangle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-warning-800">Pendiente de revisión humana</p>
                  <p className="text-xs text-warning-700">
                    {`Confianza ${scorePct}%. Se revisa cuando el score es menor a ${Math.round(umbral * 100)}% o hay ambigüedad detectada.`}
                  </p>
                </div>
                {puedeAuditar && (
                  <Button size="sm" onClick={() => navigate('/auditoria')} leftIcon={<ShieldCheck className="w-4 h-4" />}>
                    Revisar
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-success-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
                <div>
                  <p className="font-medium text-success-800">Procesado automáticamente</p>
                  <p className="text-xs text-success-700">Confianza {scorePct}% • sin intervención humana requerida</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'contenido',
      label: 'Contenido original',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <Card variant="default" padding="lg">
          <pre className="text-xs font-mono bg-neutral-100 text-neutral-700 p-4 rounded-lg max-h-[480px] overflow-auto whitespace-pre-wrap">
            {doc.contenido || 'Sin contenido disponible'}
          </pre>
        </Card>
      ),
    },
  ];

  const ruta = rutaDeDocumento(doc);
  const metaRuta = RUTA_META[ruta];
  const datosClave = [
    { label: 'Destino', valor: doc.destino ? doc.destino.replace(/_/g, ' ') : 'Sin destino' },
    { label: 'Paciente', valor: doc.paciente.nombre || 'Sin identificar' },
    { label: 'Canal de origen', valor: doc.canalOrigen ? doc.canalOrigen.replace(/_/g, ' ') : '—' },
    { label: 'Archivo', valor: doc.nombreArchivo || 'Texto pegado' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in">
      <section className="bg-aurora rounded-3xl px-6 py-6 lg:px-8 lg:py-7">
        <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl glass-ink px-3 py-1.5 text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setVerJson(true)}
              className="inline-flex items-center gap-1.5 rounded-xl glass-ink px-3 py-1.5 text-sm font-medium text-white/75 hover:text-white transition-colors">
              <Code2 className="w-4 h-4" /> Ver JSON
            </button>
            <button type="button" onClick={descargar}
              className="inline-flex items-center gap-1.5 rounded-xl glass-ink px-3 py-1.5 text-sm font-medium text-white/75 hover:text-white transition-colors">
              <Download className="w-4 h-4" /> Descargar
            </button>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                <span className={cn('w-1.5 h-1.5 rounded-full', metaRuta.punto)} /> {metaRuta.nombre}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                <estado.Icon className="w-3.5 h-3.5" /> {estado.label}
              </span>
              {doc.prioridad === 'Urgente' && (
                <span className="inline-flex items-center rounded-full bg-danger-500 px-2.5 py-1 text-xs font-semibold text-white">Urgente</span>
              )}
            </div>
            <h2 className="mt-3 text-2xl lg:text-[32px] leading-tight font-bold text-white">{doc.tipo}</h2>
            <p className="mt-1 text-sm text-white/50">
              {doc.especialidad} • <span className="font-mono">{doc.documentoId}</span>
              {doc.fecha && ` • ${new Date(doc.fecha).toLocaleString('es-CO')}`}
            </p>
          </div>
          <AnilloConfianza valor={doc.scoreConfianza} umbral={umbral} />
        </div>

        <GrafoAgente tono="oscuro" ruta={ruta} alerta={!!doc.notificacion} className="relative mt-2 max-w-[860px] mx-auto" />

        <dl className="relative mt-2 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
          {datosClave.map((d) => (
            <div key={d.label} className="bg-ink-950/60 px-4 py-3 min-w-0">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-white/40">{d.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-white truncate" title={d.valor}>{d.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Tabs tabs={tabs} variant="enclosed" />

      <Modal isOpen={verJson} onClose={() => setVerJson(false)} title="JSON del documento" size="full">
        <pre className="bg-neutral-950 text-neutral-100 p-4 rounded-xl overflow-auto max-h-[60vh] text-xs font-mono">
          {JSON.stringify(doc, null, 2)}
        </pre>
      </Modal>
    </div>
  );
}
