import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  RefreshCw,
  Bell,
  FileText,
  Inbox,
} from 'lucide-react';
import { Badge, Button, Card, Input, Select, Textarea, useToastHelpers } from '../components/ui';
import DocumentViewer from '../components/DocumentViewer';
import { cargarConfig } from '../lib/triageConfig';
import {
  mensajeError,
  springApi,
  springToUnificado,
  useAuth,
  type DatosCorregidos,
  type DecisionRevision,
  type DocumentoUnificado,
  type RevisionHumana,
} from '../lib/api';

interface FormState {
  pacienteNombre: string;
  rut: string;
  edad: string;
  medicoNombre: string;
  matricula: string;
  estudio: string;
  diagnostico: string;
  cie10: string;
  prioridad: 'Rutina' | 'Urgente';
}

const formDesdeDoc = (d: DocumentoUnificado): FormState => ({
  pacienteNombre: d.paciente.nombre ?? '',
  rut: d.paciente.rut ?? '',
  edad: d.paciente.edad != null ? String(d.paciente.edad) : '',
  medicoNombre: d.medico.nombre ?? '',
  matricula: d.medico.matricula ?? '',
  estudio: d.estudioRealizado ?? '',
  diagnostico: d.diagnosticoPrincipal ?? '',
  cie10: d.cie10Sugerido ?? '',
  prioridad: d.prioridad,
});

const confianzaVariant = (s: number, umbral: number) => (s >= 0.8 ? 'success' : s >= umbral ? 'warning' : 'danger');

const esPendiente = (d: DocumentoUnificado) =>
  !d.revision && (d.requiereAuditoria || d.status === 'en_revision');

const decisionLabel: Record<DecisionRevision, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  aprobado: { label: 'Aprobado', variant: 'success' },
  corregido: { label: 'Corregido y aprobado', variant: 'warning' },
  rechazado: { label: 'Rechazado', variant: 'danger' },
};

export default function AuditoriaPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToastHelpers();
  const umbral = useMemo(() => cargarConfig().umbralConfianza, []);

  const [docs, setDocs] = useState<DocumentoUnificado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'pendientes' | 'revisados'>('pendientes');
  const [selId, setSelId] = useState<string | number | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState<'archivo' | 'texto'>('archivo');

  // Sin sesión (demo) se permite; con sesión solo ADMIN o AUDITOR.
  const puedeRevisar = !user || user.rol === 'ADMIN' || user.rol === 'AUDITOR';

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const page = await springApi.getDocumentos(0, 200);
      setDocs(page.content.map(springToUnificado));
    } catch (e) {
      setError(mensajeError(e, 'No se pudieron cargar los documentos'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pendientes = useMemo(
    () =>
      docs
        .filter(esPendiente)
        .sort((a, b) => {
          if (a.prioridad !== b.prioridad) return a.prioridad === 'Urgente' ? -1 : 1;
          return a.scoreConfianza - b.scoreConfianza;
        }),
    [docs]
  );
  const revisados = useMemo(() => docs.filter((d) => !!d.revision), [docs]);
  const lista = filtro === 'pendientes' ? pendientes : revisados;
  const urgentesPendientes = pendientes.filter((d) => d.prioridad === 'Urgente').length;

  const seleccionado = docs.find((d) => d.id === selId) ?? null;

  useEffect(() => {
    const d = docs.find((x) => x.id === selId);
    setForm(d ? formDesdeDoc(d) : null);
    setComentario('');
    // Solo al cambiar de documento seleccionado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId]);

  const hayCambios = useMemo(() => {
    if (!seleccionado || !form) return false;
    return JSON.stringify(form) !== JSON.stringify(formDesdeDoc(seleccionado));
  }, [seleccionado, form]);

  const set = (campo: keyof FormState, valor: string) =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f));

  const enviar = async (decision: DecisionRevision) => {
    if (!seleccionado || !form || typeof seleccionado.id !== 'number') return;
    if (decision === 'rechazado' && comentario.trim().length < 5) {
      toastError('Falta el motivo', 'Escribe el motivo del rechazo (mínimo 5 caracteres).');
      return;
    }

    const edadNum = form.edad.trim() === '' ? null : Number(form.edad);
    if (edadNum !== null && (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 120)) {
      toastError('Edad inválida', 'La edad debe estar entre 0 y 120.');
      return;
    }

    const decisionFinal: DecisionRevision = decision === 'aprobado' && hayCambios ? 'corregido' : decision;
    const datosCorregidos: DatosCorregidos | undefined =
      decisionFinal === 'corregido'
        ? {
            nombrePaciente: form.pacienteNombre.trim(),
            rutPaciente: form.rut.trim(),
            edadPaciente: edadNum,
            nombreMedico: form.medicoNombre.trim(),
            matricula: form.matricula.trim(),
            estudioRealizado: form.estudio.trim() || null,
            diagnosticoPrincipal: form.diagnostico.trim() || null,
            cie10Sugerido: form.cie10.trim() || null,
            prioridad: form.prioridad,
          }
        : undefined;

    setGuardando(true);
    try {
      const resp = await springApi.revisarDocumento(seleccionado.id, {
        decision: decisionFinal,
        comentario: comentario.trim() || undefined,
        revisor: user?.nombre,
        datosCorregidos,
      });

      const revisionLocal: RevisionHumana = {
        decision: decisionFinal,
        comentario: comentario.trim() || undefined,
        revisor: user?.nombre,
        fecha: new Date().toISOString(),
      };
      const actualizado = resp ? springToUnificado(resp) : seleccionado;
      setDocs((prev) =>
        prev.map((d) =>
          d.id === seleccionado.id
            ? { ...actualizado, revision: actualizado.revision ?? revisionLocal, requiereAuditoria: false }
            : d
        )
      );

      success(decisionLabel[decisionFinal].label, `Documento ${seleccionado.documentoId} registrado.`);
      setSelId(null);
    } catch (e) {
      const msg = mensajeError(e, 'No se pudo guardar la revisión');
      toastError('Error al guardar', msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-950 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            Auditoría humana
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {`Documentos con confianza menor a ${Math.round(umbral * 100)}% o ambigüedad detectada por el agente.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="warning" dot size="md">{pendientes.length} pendientes</Badge>
          {urgentesPendientes > 0 && (
            <Badge variant="danger" dot size="md">{urgentesPendientes} urgentes</Badge>
          )}
          <Button variant="outline" size="sm" onClick={cargar} loading={cargando} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card variant="default" className="border-danger-200 bg-danger-50">
          <div className="flex items-center gap-3 text-danger-700 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        </Card>
      )}

      {!puedeRevisar && (
        <Card variant="default" className="border-warning-200 bg-warning-50">
          <p className="text-sm text-warning-800">Tu rol no permite revisar documentos. Solo ADMIN o AUDITOR.</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Lista */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['pendientes', 'revisados'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  filtro === f ? 'bg-brand-50 text-brand-700' : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                {f === 'pendientes' ? `Pendientes (${pendientes.length})` : `Revisados (${revisados.length})`}
              </button>
            ))}
          </div>

          {cargando && <p className="text-sm text-neutral-400">Cargando…</p>}

          {!cargando && lista.length === 0 && (
            <Card variant="default" className="text-center py-10">
              <Inbox className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">
                {filtro === 'pendientes' ? 'No hay documentos pendientes de revisión.' : 'Aún no hay documentos revisados.'}
              </p>
            </Card>
          )}

          {lista.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelId(d.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                selId === d.id ? 'border-brand-500 bg-brand-50/40 shadow-sm' : 'border-neutral-100 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-neutral-900 text-sm truncate">{d.tipo}</span>
                <Badge variant={confianzaVariant(d.scoreConfianza, umbral)} size="xs" dot>
                  {Math.round(d.scoreConfianza * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-neutral-500 truncate">{d.paciente.nombre || 'Paciente sin identificar'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={d.prioridad === 'Urgente' ? 'danger' : 'success'} size="xs">{d.prioridad}</Badge>
                {d.revision && (
                  <Badge variant={decisionLabel[d.revision.decision].variant} size="xs">
                    {decisionLabel[d.revision.decision].label}
                  </Badge>
                )}
                <span className="text-[11px] text-neutral-400 font-mono truncate">{d.documentoId}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detalle */}
        {!seleccionado || !form ? (
          <Card variant="default" className="text-center py-20">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">Selecciona un documento para revisarlo.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card variant="default" padding="lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-neutral-900">{seleccionado.tipo}</h2>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">{seleccionado.documentoId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={seleccionado.prioridad === 'Urgente' ? 'danger' : 'success'} dot>
                    {seleccionado.prioridad}
                  </Badge>
                  <Badge variant={confianzaVariant(seleccionado.scoreConfianza, umbral)} dot>
                    Confianza {Math.round(seleccionado.scoreConfianza * 100)}%
                  </Badge>
                </div>
              </div>
              {seleccionado.justificacion && (
                <p className="mt-3 text-sm text-neutral-700 bg-warning-50 border border-warning-200 rounded-lg p-3">
                  {seleccionado.justificacion}
                </p>
              )}
              {seleccionado.notificacion && (
                <div className="mt-3 flex items-start gap-2 text-sm bg-danger-50 border border-danger-200 rounded-lg p-3 text-danger-800">
                  <Bell className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{seleccionado.notificacion.canal}</p>
                    <p>{seleccionado.notificacion.mensaje}</p>
                  </div>
                </div>
              )}
            </Card>

            <div className="grid xl:grid-cols-2 gap-4">
              <Card variant="default" padding="lg">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    Documento original
                  </h3>
                  <div className="inline-flex rounded-lg bg-neutral-100 p-1" role="group" aria-label="Vista del documento">
                    {(['archivo', 'texto'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVista(v)}
                        aria-pressed={vista === v}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          vista === v ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        {v === 'archivo' ? 'Archivo' : 'Texto extraído'}
                      </button>
                    ))}
                  </div>
                </div>
                {vista === 'archivo' ? (
                  <DocumentViewer
                    documentoId={typeof seleccionado.id === 'number' ? seleccionado.id : null}
                    onVerTexto={() => setVista('texto')}
                  />
                ) : (
                  <pre className="text-xs font-mono bg-neutral-100 text-neutral-700 p-3 rounded-lg max-h-[560px] overflow-auto whitespace-pre-wrap">
                    {seleccionado.contenido || 'Sin contenido disponible'}
                  </pre>
                )}
              </Card>

              <Card variant="default" padding="lg">
                <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-brand-500" />
                  Datos extraídos
                </h3>
                <div className="space-y-3">
                  <Input label="Paciente" value={form.pacienteNombre} onChange={(e) => set('pacienteNombre', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="RUT" value={form.rut} onChange={(e) => set('rut', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                    <Input label="Edad" type="number" min={0} max={120} value={form.edad} onChange={(e) => set('edad', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Médico solicitante" value={form.medicoNombre} onChange={(e) => set('medicoNombre', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                    <Input label="Matrícula" value={form.matricula} onChange={(e) => set('matricula', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                  </div>
                  <Input label="Estudio realizado" value={form.estudio} onChange={(e) => set('estudio', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                  <Input label="Diagnóstico principal" value={form.diagnostico} onChange={(e) => set('diagnostico', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="CIE-10" value={form.cie10} onChange={(e) => set('cie10', e.target.value)} disabled={!!seleccionado.revision || !puedeRevisar} />
                    <Select
                      label="Prioridad"
                      value={form.prioridad}
                      onChange={(e) => set('prioridad', e.target.value)}
                      options={[
                        { value: 'Rutina', label: 'Rutina' },
                        { value: 'Urgente', label: 'Urgente' },
                      ]}
                      disabled={!!seleccionado.revision || !puedeRevisar}
                    />
                  </div>

                  {seleccionado.medicamentos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-1.5">Medicamentos</p>
                      <ul className="space-y-1.5 text-sm">
                        {seleccionado.medicamentos.map((m, i) => (
                          <li key={i} className="bg-neutral-50 rounded-lg px-3 py-2">
                            <span className="font-semibold text-neutral-900">{m.nombre}</span>
                            <span className="text-neutral-500">
                              {[m.dosis, m.frecuencia, m.via, m.duracion].filter(Boolean).join(' · ')
                                ? ` — ${[m.dosis, m.frecuencia, m.via, m.duracion].filter(Boolean).join(' · ')}`
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Acciones */}
            <Card variant="default" padding="lg">
              {seleccionado.revision ? (
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {decisionLabel[seleccionado.revision.decision].label}
                      {seleccionado.revision.revisor ? ` por ${seleccionado.revision.revisor}` : ''}
                    </p>
                    <p className="text-neutral-500">{new Date(seleccionado.revision.fecha).toLocaleString('es-CO')}</p>
                    {seleccionado.revision.comentario && (
                      <p className="mt-2 text-neutral-700">{seleccionado.revision.comentario}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    label="Comentario del auditor"
                    hint="Obligatorio al rechazar."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    disabled={guardando || !puedeRevisar}
                    className="min-h-[80px]"
                  />
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button
                      variant="danger"
                      onClick={() => enviar('rechazado')}
                      loading={guardando}
                      disabled={!puedeRevisar}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Rechazar
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => enviar('aprobado')}
                      loading={guardando}
                      disabled={!puedeRevisar}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      {hayCambios ? 'Guardar corrección y aprobar' : 'Aprobar extracción'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
