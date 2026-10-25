import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileJson,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bell,
  ArrowRight,
  ShieldCheck,
  Type,
  FlaskConical,
  Play,
  ClipboardPaste,
  Database,
  Zap,
  Timer,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Select, Textarea, useToastHelpers } from '../components/ui';
import GrafoAgente, { rutaDeDocumento, type RutaAgente } from '../components/GrafoAgente';
import { cn } from '../lib/design-system';
import {
  mensajeError,
  procesarArchivo,
  procesarTexto,
  useAuth,
  type DocumentoUnificado,
  type ModoProcesamiento,
} from '../lib/api';
import { CANALES_ORIGEN, CASOS_DEMO, ESCENARIO_META, type CasoDemo } from '../lib/demoCases';
import { cargarConfig, evaluarReglas } from '../lib/triageConfig';

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/json'];
const ACCEPT_ATTR = '.pdf,.png,.jpg,.jpeg,.json,application/pdf,image/png,image/jpeg,application/json';
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MIN_TEXTO = 20;
const MAX_TEXTO = 20000;

type Tab = 'archivo' | 'texto' | 'demo';
type EstadoArchivo = 'pendiente' | 'procesando' | 'listo' | 'error';

interface ArchivoEnCola {
  id: string;
  file: File;
  preview: string | null;
  estado: EstadoArchivo;
  error?: string;
}

interface Resultado {
  key: string;
  origen: string;
  modo: ModoProcesamiento;
  doc: DocumentoUnificado;
}

const formatSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

const iconoArchivo = (f: File) =>
  f.type.startsWith('image/') ? ImageIcon : f.type === 'application/json' ? FileJson : FileText;

const colorConfianza = (s: number, umbral: number) => (s >= 0.8 ? 'bg-success-500' : s >= umbral ? 'bg-warning-500' : 'bg-danger-500');

const RUTA_META: Record<RutaAgente, { nombre: string; chip: string; barra: string }> = {
  estandar: { nombre: 'Flujo estándar', chip: 'bg-success-50 text-success-700 ring-success-500/20', barra: 'bg-success-500' },
  urgencia: { nombre: 'Emergencias', chip: 'bg-danger-50 text-danger-700 ring-danger-500/20', barra: 'bg-danger-500' },
  revision_humana: { nombre: 'Revisión humana', chip: 'bg-warning-50 text-warning-700 ring-warning-500/20', barra: 'bg-warning-500' },
};

const ESCENARIO_ESTILO = {
  rutina: { barra: 'from-success-500 to-aqua-400', punto: 'bg-success-500', texto: 'text-success-700' },
  urgencia: { barra: 'from-danger-500 to-[#ff8a65]', punto: 'bg-danger-500', texto: 'text-danger-700' },
  ambiguo: { barra: 'from-warning-500 to-[#fdd835]', punto: 'bg-warning-500', texto: 'text-warning-700' },
} as const;

const reloj = (seg: number) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;

let contador = 0;
const nuevaClave = () => `${Date.now()}-${contador++}`;

export default function UploadPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError, warning } = useToastHelpers();
  const config = useMemo(() => cargarConfig(), []);
  const puedeAuditar = !user || user.rol === 'ADMIN' || user.rol === 'AUDITOR';

  const [tab, setTab] = useState<Tab>('archivo');
  const [modo, setModo] = useState<ModoProcesamiento>(isAuthenticated ? 'spring' : 'fastapi');
  const [archivos, setArchivos] = useState<ArchivoEnCola[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [texto, setTexto] = useState('');
  const [canal, setCanal] = useState<string>(CANALES_ORIGEN[0]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [pasoResultado, setPasoResultado] = useState(8);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  // Libera las vistas previas al salir de la pantalla.
  useEffect(() => {
    const urls = previewsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Cronómetro del documento en curso: Gemini puede tardar minutos cuando está saturado.
  useEffect(() => {
    if (!enCurso) return;
    const inicio = Date.now();
    setSegundos(0);
    const t = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [enCurso]);

  // Al llegar un resultado, la luz termina de recorrer la ruta elegida.
  const ultimo = resultados[0];
  useEffect(() => {
    if (ultimo) setPasoResultado(5);
  }, [ultimo?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pasoResultado >= 8) return;
    const t = window.setTimeout(() => setPasoResultado((p) => p + 1), 420);
    return () => window.clearTimeout(t);
  }, [pasoResultado]);

  const agregarArchivos = useCallback(
    (lista: FileList | File[]) => {
      const nuevos: ArchivoEnCola[] = [];
      Array.from(lista).forEach((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toastError('Formato no soportado', `${file.name}: usa PDF, PNG, JPG o JSON.`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toastError('Archivo muy grande', `${file.name} supera los 25 MB.`);
          return;
        }
        let preview: string | null = null;
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
          previewsRef.current.push(preview);
        }
        nuevos.push({ id: nuevaClave(), file, preview, estado: 'pendiente' });
      });
      if (nuevos.length) setArchivos((prev) => [...prev, ...nuevos]);
    },
    [toastError]
  );

  const quitarArchivo = (id: string) => {
    setArchivos((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const registrarResultado = (origen: string, doc: DocumentoUnificado, m: ModoProcesamiento) => {
    setResultados((prev) => [{ key: nuevaClave(), origen, modo: m, doc }, ...prev]);
    if (doc.prioridad === 'Urgente') warning('Documento urgente', `${doc.tipo}: ${doc.notificacion?.mensaje ?? 'revisa el resultado.'}`);
    else if (doc.requiereAuditoria) warning('Requiere auditoría humana', 'El agente derivó el documento a revisión.');
    else success('Documento procesado', `${doc.tipo} • ${Math.round(doc.scoreConfianza * 100)}% de confianza`);
  };

  const procesarCola = async () => {
    const pendientes = archivos.filter((a) => a.estado === 'pendiente' || a.estado === 'error');
    if (!pendientes.length) return;
    setProcesando(true);
    for (const item of pendientes) {
      setArchivos((prev) => prev.map((a) => (a.id === item.id ? { ...a, estado: 'procesando', error: undefined } : a)));
      setEnCurso(item.file.name);
      try {
        const doc = await procesarArchivo(item.file, modo, canal);
        setArchivos((prev) => prev.map((a) => (a.id === item.id ? { ...a, estado: 'listo' } : a)));
        registrarResultado(item.file.name, doc, modo);
      } catch (e) {
        const msg = mensajeError(e, 'No se pudo procesar el archivo');
        setArchivos((prev) => prev.map((a) => (a.id === item.id ? { ...a, estado: 'error', error: msg } : a)));
        toastError('Error al procesar', `${item.file.name}: ${msg}`);
      }
    }
    setEnCurso(null);
    setProcesando(false);
  };

  const procesarTextoLibre = async (contenido: string, canalOrigen: string, etiqueta: string) => {
    const limpio = contenido.trim();
    if (limpio.length < MIN_TEXTO) {
      toastError('Texto muy corto', `Escribe al menos ${MIN_TEXTO} caracteres.`);
      return;
    }
    if (limpio.length > MAX_TEXTO) {
      toastError('Texto muy largo', `El máximo es ${MAX_TEXTO.toLocaleString('es-CO')} caracteres.`);
      return;
    }
    setProcesando(true);
    setEnCurso(etiqueta);
    try {
      const doc = await procesarTexto(limpio, modo, canalOrigen);
      registrarResultado(etiqueta, doc, modo);
    } catch (e) {
      toastError('Error al procesar', mensajeError(e, 'No se pudo procesar el texto'));
    } finally {
      setEnCurso(null);
      setProcesando(false);
    }
  };

  const cargarCaso = (caso: CasoDemo) => {
    setTexto(caso.texto);
    setCanal(caso.canalOrigen);
    setTab('texto');
  };

  const verDetalle = (doc: DocumentoUnificado) =>
    navigate(`/documentos/${encodeURIComponent(doc.documentoId)}`, { state: { documento: doc } });

  const pendientesCount = archivos.filter((a) => a.estado === 'pendiente' || a.estado === 'error').length;

  const tabs: { id: Tab; label: string; icon: typeof UploadCloud }[] = [
    { id: 'archivo', label: 'Subir archivo', icon: UploadCloud },
    { id: 'texto', label: 'Pegar texto', icon: Type },
    { id: 'demo', label: 'Casos de prueba', icon: FlaskConical },
  ];

  const rutaUltima = ultimo ? rutaDeDocumento(ultimo.doc) : null;
  const metaUltima = rutaUltima ? RUTA_META[rutaUltima] : null;

  const encabezado = enCurso
    ? {
        titulo: `Analizando «${enCurso}»`,
        detalle:
          segundos < 60
            ? 'Gemini lee el documento, extrae los datos y el agente los valida antes de decidir la ruta.'
            : 'Sigue trabajando. Con alta demanda en Gemini puede tardar hasta 5 minutos; el agente reintenta solo.',
      }
    : ultimo && metaUltima
      ? {
          titulo: `${ultimo.doc.tipo} → ${ultimo.doc.destino ? ultimo.doc.destino.replace(/_/g, ' ') : metaUltima.nombre}`,
          detalle:
            rutaUltima === 'revision_humana'
              ? 'Confianza baja o datos incompletos: el documento queda esperando a una persona en Auditoría humana.'
              : rutaUltima === 'urgencia'
                ? `Marcado como urgente${ultimo.doc.notificacion ? ' y con alerta enviada a la guardia' : ''}. Entró a la cola de emergencias.`
                : `Enrutado sin intervención humana con ${Math.round(ultimo.doc.scoreConfianza * 100)}% de confianza.`,
        }
      : {
          titulo: 'Listo para recibir un documento',
          detalle: 'Sube un archivo, pega texto o usa un caso de prueba. Aquí verás en vivo cada paso de la decisión del agente.',
        };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in">
      {/* Consola del agente */}
      <section className="bg-aurora rounded-3xl px-6 py-6 lg:px-8 lg:py-7" aria-live="polite">
        <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
                <Sparkles className="w-3.5 h-3.5 text-aqua-300" /> Consola del agente
              </span>
              {enCurso ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-2.5 py-1 text-xs font-semibold text-brand-200 ring-1 ring-brand-400/30">
                  <Timer className="w-3.5 h-3.5" /> <span className="kpi-number">{reloj(segundos)}</span>
                </span>
              ) : (
                !!metaUltima && (
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', metaUltima.chip)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', metaUltima.barra)} /> {metaUltima.nombre}
                  </span>
                )
              )}
            </div>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold text-white truncate">{encabezado.titulo}</h2>
            <p className="mt-1 text-sm text-white/55">{encabezado.detalle}</p>
          </div>

          <div className="shrink-0">
            <div className="inline-flex rounded-xl bg-white/[0.06] border border-white/10 p-1" role="group" aria-label="Modo de procesamiento">
              {([
                ['spring', 'Persistente', Database],
                ['fastapi', 'Directo', Zap],
              ] as const).map(([valor, label, Icon]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setModo(valor)}
                  disabled={(valor === 'spring' && !isAuthenticated) || procesando}
                  title={valor === 'spring' && !isAuthenticated ? 'Inicia sesión para guardar documentos' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                    modo === valor ? 'bg-white text-ink-900 shadow-sm' : 'text-white/60 hover:text-white'
                  )}
                  aria-pressed={modo === valor}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/40 max-w-[16rem] sm:text-right">
              {modo === 'spring' ? 'Se guarda y aparece en colas, historial y auditoría.' : 'Solo analiza con el motor de IA; no se guarda.'}
            </p>
          </div>
        </div>

        <GrafoAgente
          tono="oscuro"
          procesando={!!enCurso}
          ruta={enCurso ? null : rutaUltima}
          paso={pasoResultado}
          alerta={!!ultimo?.doc.notificacion}
          className="relative mt-2 -mb-2 max-w-[860px] mx-auto"
        />

        {!!enCurso && (
          <div className="relative mt-1 h-1 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-aqua-400 to-transparent animate-sweep" />
          </div>
        )}
      </section>

      {/* Entrada */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="inline-flex p-1 rounded-2xl bg-white border border-neutral-200/80 shadow-xs" role="tablist">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  tab === id ? 'bg-ink-900 text-white shadow-sm' : 'text-neutral-500 hover:text-ink-900 hover:bg-neutral-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Lock className="w-3.5 h-3.5" /> Usa documentos de prueba: se envían a un servicio externo de IA.
          </p>
        </div>

        {/* --- Archivo --- */}
        {tab === 'archivo' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                if (e.dataTransfer.files?.length) agregarArchivos(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Seleccionar archivos"
              className={cn(
                'group relative overflow-hidden rounded-3xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-all',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
                arrastrando ? 'border-brand-500 bg-brand-50/70 scale-[1.01]' : 'border-neutral-300 bg-white hover:border-brand-400 hover:bg-brand-25'
              )}
            >
              <div className="absolute inset-0 bg-grid-light opacity-60" aria-hidden="true" />
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-aqua-500 text-white flex items-center justify-center shadow-glow animate-float-slow">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="mt-5 text-lg font-semibold text-ink-900">{arrastrando ? 'Suelta para agregarlos' : 'Arrastra tus documentos aquí'}</p>
                <p className="text-sm text-neutral-500 mt-1">
                  o <span className="font-semibold text-brand-600 group-hover:underline underline-offset-2">elige archivos</span> desde tu equipo · hasta 25 MB cada uno
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  {['PDF', 'PNG', 'JPG', 'JSON'].map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-[11px] font-mono font-semibold text-neutral-500">{f}</span>
                  ))}
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) agregarArchivos(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {archivos.length > 0 && (
              <Card variant="default" padding="none" className="overflow-hidden">
                <ul className="divide-y divide-neutral-100">
                  {archivos.map((a) => {
                    const Icono = iconoArchivo(a.file);
                    return (
                      <li key={a.id} className={cn('flex items-center gap-3 px-5 py-3.5 transition-colors', a.estado === 'procesando' && 'bg-brand-25')}>
                        {a.preview ? (
                          <img src={a.preview} alt="" className="w-10 h-10 rounded-xl object-cover bg-neutral-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-aqua-50 text-brand-600 ring-1 ring-brand-100 flex items-center justify-center">
                            <Icono className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">{a.file.name}</p>
                          <p className="text-xs text-neutral-500">
                            {formatSize(a.file.size)}
                            {a.estado === 'procesando' && <span className="text-brand-600"> • analizando… {reloj(segundos)}</span>}
                            {a.error && <span className="text-danger-600"> • {a.error}</span>}
                          </p>
                        </div>
                        {a.estado === 'procesando' && <Loader2 className="w-5 h-5 text-brand-500 animate-spin" aria-label="Procesando" />}
                        {a.estado === 'listo' && <CheckCircle2 className="w-5 h-5 text-success-500" aria-label="Procesado" />}
                        {a.estado === 'error' && <XCircle className="w-5 h-5 text-danger-500" aria-label="Error" />}
                        <button
                          type="button"
                          onClick={() => quitarArchivo(a.id)}
                          disabled={a.estado === 'procesando'}
                          className="p-2 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 disabled:opacity-40"
                          aria-label={`Quitar ${a.file.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 bg-neutral-50/70">
                  <p className="text-sm text-neutral-500">
                    {archivos.length} archivo{archivos.length === 1 ? '' : 's'} • {pendientesCount} por procesar
                  </p>
                  <Button onClick={procesarCola} loading={procesando} disabled={pendientesCount === 0} leftIcon={<Play className="w-4 h-4" />}>
                    Procesar {pendientesCount > 0 ? `(${pendientesCount})` : ''}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* --- Texto --- */}
        {tab === 'texto' && (
          <Card variant="default" padding="lg" className="space-y-4">
            <Textarea
              label="Texto del documento clínico"
              placeholder="Pega aquí el contenido de la receta, informe, orden de procedimiento, epicrisis o certificado…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="min-h-[220px] font-mono text-sm"
              hint={`${texto.trim().length.toLocaleString('es-CO')} / ${MAX_TEXTO.toLocaleString('es-CO')} caracteres`}
            />
            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <Select
                label="Canal de origen"
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                options={CANALES_ORIGEN.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setTexto('')} disabled={!texto || procesando}>
                  Limpiar
                </Button>
                <Button onClick={() => procesarTextoLibre(texto, canal, 'Texto pegado')} loading={procesando} leftIcon={<Play className="w-4 h-4" />}>
                  Procesar texto
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* --- Casos de prueba --- */}
        {tab === 'demo' && (
          <div className="grid md:grid-cols-3 gap-4">
            {CASOS_DEMO.map((caso) => {
              const meta = ESCENARIO_META[caso.escenario];
              const estilo = ESCENARIO_ESTILO[caso.escenario];
              return (
                <Card key={caso.id} variant="default" padding="none" className="lift flex flex-col overflow-hidden">
                  <div className={cn('h-1 bg-gradient-to-r', estilo.barra)} />
                  <div className="p-5 flex-1 flex flex-col">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider', estilo.texto)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', estilo.punto)} /> {meta.label}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-ink-900">{caso.titulo}</h3>
                    <p className="text-sm text-neutral-500 mt-1">{caso.descripcion}</p>
                    <pre className="mt-4 flex-1 max-h-28 overflow-hidden rounded-xl bg-neutral-50 border border-neutral-100 p-3 text-[11px] leading-relaxed font-mono text-neutral-500 whitespace-pre-wrap [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
                      {caso.texto}
                    </pre>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => cargarCaso(caso)} leftIcon={<ClipboardPaste className="w-4 h-4" />}>
                        Ver texto
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => procesarTextoLibre(caso.texto, caso.canalOrigen, caso.titulo)}
                        loading={procesando}
                        leftIcon={<Play className="w-4 h-4" />}
                      >
                        Procesar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
            <p className="md:col-span-3 text-xs text-neutral-400">
              Casos sintéticos para la demostración: cubren los escenarios de rutina, urgencia y ambigüedad. No contienen datos reales de pacientes.
            </p>
          </div>
        )}
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <section className="space-y-4" aria-label="Resultados">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Resultados de esta sesión</h2>
            <p className="text-sm text-neutral-500">
              {resultados.length} documento{resultados.length === 1 ? '' : 's'} analizado{resultados.length === 1 ? '' : 's'}
            </p>
          </div>
          {resultados.map(({ key, origen, modo: m, doc }) => {
            const evaluacion = evaluarReglas(doc, config);
            const ruta = RUTA_META[rutaDeDocumento(doc)];
            const pct = Math.round(doc.scoreConfianza * 100);
            return (
              <Card key={key} variant="default" padding="none" className="relative overflow-hidden animate-in">
                <span className={cn('absolute left-0 inset-y-0 w-1', ruta.barra)} aria-hidden="true" />
                <div className="p-6 pl-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-ink-900">{doc.tipo}</h3>
                      <p className="text-sm text-neutral-500 truncate">
                        {doc.especialidad} • <span className="font-mono text-xs">{doc.documentoId}</span>
                        {origen !== doc.documentoId ? ` • ${origen}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', ruta.chip)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', ruta.barra)} /> {ruta.nombre}
                      </span>
                      {doc.prioridad === 'Urgente' && (
                        <span className="inline-flex items-center rounded-full bg-danger-600 px-2.5 py-1 text-xs font-semibold text-white">Urgente</span>
                      )}
                      {!doc.requiereAuditoria && evaluacion.sugiereAuditoria && (
                        <span className="inline-flex items-center rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700 ring-1 ring-warning-500/20">
                          Revisar: confianza baja
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 mt-5">
                    <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
                      <p className="text-xs text-neutral-500" title="Estimación del modelo de IA, no una probabilidad exacta">
                        Confianza estimada
                      </p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <span className="kpi-number text-xl font-bold text-ink-900">{pct}%</span>
                        <span className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                          <span className={cn('block h-full rounded-full', colorConfianza(doc.scoreConfianza, config.umbralConfianza))} style={{ width: `${pct}%` }} />
                        </span>
                      </div>
                    </div>
                    <div className="sm:col-span-2 rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
                      <p className="text-xs text-neutral-500">Destino</p>
                      <p className="mt-1.5 font-mono text-sm font-semibold text-brand-700 truncate">{doc.destino || 'Sin destino asignado'}</p>
                    </div>
                  </div>

                  {doc.justificacion && <p className="mt-4 text-sm text-neutral-600 leading-relaxed">{doc.justificacion}</p>}

                  {doc.notificacion && (
                    <div className="mt-4 flex items-start gap-3 text-sm bg-danger-50 border border-danger-200 rounded-xl p-3.5 text-danger-700">
                      <span className="w-8 h-8 rounded-lg bg-danger-500 text-white flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="font-semibold">{doc.notificacion.canal}</p>
                        <p>{doc.notificacion.mensaje}</p>
                      </div>
                    </div>
                  )}

                  {evaluacion.motivos.length > 0 && (
                    <div className="mt-3 flex items-start gap-2 text-sm bg-warning-50 border border-warning-200 rounded-xl p-3.5 text-warning-700">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Según tus reglas de triaje</p>
                        <ul className="list-disc pl-4">
                          {evaluacion.motivos.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                    <p className="text-xs text-neutral-400">
                      {m === 'fastapi' ? 'Modo directo: este resultado no se guardó en el historial.' : 'Guardado en el historial.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {doc.requiereAuditoria && puedeAuditar && m === 'spring' && (
                        <Button variant="outline" size="sm" onClick={() => navigate('/auditoria')} leftIcon={<ShieldCheck className="w-4 h-4" />}>
                          Ir a auditoría
                        </Button>
                      )}
                      <Button size="sm" onClick={() => verDetalle(doc)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Ver decisión completa
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
