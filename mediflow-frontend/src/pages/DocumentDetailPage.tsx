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
import { Badge, Button, Card, Modal, Progress, Tabs } from '../components/ui';
import { mensajeError, obtenerDocumentoUnificado, useAuth, type DocumentoUnificado } from '../lib/api';
import { cargarConfig } from '../lib/triageConfig';

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

  const descargar = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento-${doc.documentoId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
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
                Este registro no incluye datos de almacenamiento. El backend debe devolverlos para mostrar el bucket y la ruta del objeto.
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-950">Detalle del documento</h1>
            <p className="text-neutral-500 text-sm">
              <span className="font-mono">{doc.documentoId}</span>
              {doc.fecha && ` • ${new Date(doc.fecha).toLocaleString('es-CO')}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={estado.variant} dot size="md">
            <estado.Icon className="w-3.5 h-3.5 mr-1" />
            {estado.label}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setVerJson(true)} leftIcon={<Code2 className="w-4 h-4" />}>Ver JSON</Button>
          <Button variant="outline" size="sm" onClick={descargar} leftIcon={<Download className="w-4 h-4" />}>Descargar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" padding="lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><FileText className="w-6 h-6" /></div>
            <div className="min-w-0"><p className="text-sm text-neutral-500">Tipo</p><p className="font-bold text-neutral-900 truncate">{doc.tipo}</p></div>
          </div>
        </Card>
        <Card variant="default" padding="lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-info-50 text-info-600 flex items-center justify-center"><Brain className="w-6 h-6" /></div>
            <div className="min-w-0"><p className="text-sm text-neutral-500">Especialidad</p><p className="font-bold text-neutral-900 truncate">{doc.especialidad}</p></div>
          </div>
        </Card>
        <Card variant="default" padding="lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center"><Shield className="w-6 h-6" /></div>
            <div><p className="text-sm text-neutral-500">Prioridad</p><Badge variant={doc.prioridad === 'Urgente' ? 'danger' : 'success'} dot>{doc.prioridad}</Badge></div>
          </div>
        </Card>
        <Card variant="default" padding="lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-neutral-500">Confianza</p>
              <div className="flex items-center gap-2">
                <Progress value={scorePct} size="sm" className="w-24" variant={doc.scoreConfianza >= 0.8 ? 'success' : doc.scoreConfianza >= umbral ? 'warning' : 'danger'} />
                <span className="font-semibold tabular-nums">{scorePct}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} />

      <Modal isOpen={verJson} onClose={() => setVerJson(false)} title="JSON del documento" size="full">
        <pre className="bg-neutral-950 text-neutral-100 p-4 rounded-xl overflow-auto max-h-[60vh] text-xs font-mono">
          {JSON.stringify(doc, null, 2)}
        </pre>
      </Modal>
    </div>
  );
}
