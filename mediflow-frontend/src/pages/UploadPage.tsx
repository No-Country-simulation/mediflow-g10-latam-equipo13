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
} from 'lucide-react';
import { Badge, Button, Card, Progress, Select, Textarea, useToastHelpers } from '../components/ui';
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

const confianzaVariant = (s: number, umbral: number) => (s >= 0.8 ? 'success' : s >= umbral ? 'warning' : 'danger');

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
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  // Libera las vistas previas al salir de la pantalla.
  useEffect(() => {
    const urls = previewsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

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
    try {
      const doc = await procesarTexto(limpio, modo, canalOrigen);
      registrarResultado(etiqueta, doc, modo);
    } catch (e) {
      toastError('Error al procesar', mensajeError(e, 'No se pudo procesar el texto'));
    } finally {
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-950">Procesar documento</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Sube un PDF, una imagen o texto clínico. El agente lo clasifica, extrae los datos y decide a dónde enrutarlo.
        </p>
      </div>

      {/* Modo de procesamiento */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Modo de procesamiento</p>
            <p className="text-xs text-neutral-500">
              {modo === 'spring'
                ? 'Persistente: el documento se guarda y aparece en colas, historial y auditoría.'
                : 'Directo: solo analiza con el motor de IA. No se guarda el documento.'}
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-neutral-100 p-1" role="group" aria-label="Modo de procesamiento">
            {([
              ['spring', 'Persistente', Database],
              ['fastapi', 'Directo', Zap],
            ] as const).map(([valor, label, Icon]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setModo(valor)}
                disabled={valor === 'spring' && !isAuthenticated}
                title={valor === 'spring' && !isAuthenticated ? 'Inicia sesión para guardar documentos' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  modo === valor ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                )}
                aria-pressed={modo === valor}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Pestañas de entrada */}
      <div>
        <div className="flex gap-1 border-b border-neutral-200 mb-5" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
                tab === id ? 'border-brand-500 text-brand-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
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
                'rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30',
                arrastrando ? 'border-brand-500 bg-brand-50' : 'border-neutral-300 bg-white hover:border-brand-300 hover:bg-neutral-50'
              )}
            >
              <UploadCloud className="w-10 h-10 text-brand-500 mx-auto mb-3" />
              <p className="font-semibold text-neutral-900">Arrastra tus documentos aquí o haz clic para elegirlos</p>
              <p className="text-sm text-neutral-500 mt-1">PDF, PNG, JPG o JSON • hasta 25 MB por archivo</p>
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
              <Card variant="default" padding="none">
                <ul className="divide-y divide-neutral-100">
                  {archivos.map((a) => {
                    const Icono = iconoArchivo(a.file);
                    return (
                      <li key={a.id} className="flex items-center gap-3 p-4">
                        {a.preview ? (
                          <img src={a.preview} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                            <Icono className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{a.file.name}</p>
                          <p className="text-xs text-neutral-500">
                            {formatSize(a.file.size)}
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
                <div className="flex items-center justify-between p-4 border-t border-neutral-100 bg-neutral-50 rounded-b-2xl">
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
              return (
                <Card key={caso.id} variant="default" padding="lg" className="flex flex-col">
                  <Badge variant={meta.variant} dot className="self-start mb-3">{meta.label}</Badge>
                  <h3 className="font-bold text-neutral-900">{caso.titulo}</h3>
                  <p className="text-sm text-neutral-500 mt-1 flex-1">{caso.descripcion}</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => cargarCaso(caso)} leftIcon={<ClipboardPaste className="w-4 h-4" />}>
                      Ver texto
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => procesarTextoLibre(caso.texto, caso.canalOrigen, caso.titulo)}
                      loading={procesando}
                      leftIcon={<Play className="w-4 h-4" />}
                    >
                      Procesar
                    </Button>
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
          <h2 className="text-lg font-bold text-neutral-900">Resultados de esta sesión</h2>
          {resultados.map(({ key, origen, modo: m, doc }) => {
            const evaluacion = evaluarReglas(doc, config);
            return (
              <Card key={key} variant="default" padding="lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-neutral-900">{doc.tipo}</h3>
                    <p className="text-sm text-neutral-500">
                      {doc.especialidad} • <span className="font-mono text-xs">{doc.documentoId}</span>
                      {origen !== doc.documentoId ? ` • ${origen}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={doc.prioridad === 'Urgente' ? 'danger' : 'success'} dot>{doc.prioridad}</Badge>
                    <Badge variant={doc.requiereAuditoria || evaluacion.sugiereAuditoria ? 'warning' : 'success'} dot>
                      {doc.requiereAuditoria ? 'Requiere auditoría' : evaluacion.sugiereAuditoria ? 'Revisar: confianza baja' : 'Procesado'}
                    </Badge>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1.5" title="Estimación del modelo de IA, no una probabilidad exacta">
                      Confianza estimada por la IA
                    </p>
                    <div className="flex items-center gap-3">
                      <Progress value={doc.scoreConfianza * 100} size="md" className="flex-1" variant={confianzaVariant(doc.scoreConfianza, config.umbralConfianza)} />
                      <span className="text-sm font-semibold tabular-nums">{Math.round(doc.scoreConfianza * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Destino</p>
                    <p className="text-sm font-semibold text-brand-600">{doc.destino || 'Sin destino asignado'}</p>
                  </div>
                </div>

                {doc.justificacion && (
                  <p className="mt-4 text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3">{doc.justificacion}</p>
                )}

                {doc.notificacion && (
                  <div className="mt-3 flex items-start gap-2 text-sm bg-danger-50 border border-danger-200 rounded-lg p-3 text-danger-800">
                    <Bell className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">{doc.notificacion.canal}</p>
                      <p>{doc.notificacion.mensaje}</p>
                    </div>
                  </div>
                )}

                {evaluacion.motivos.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 text-sm bg-warning-50 border border-warning-200 rounded-lg p-3 text-warning-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Según tus reglas de Configuración</p>
                      <ul className="list-disc pl-4">
                        {evaluacion.motivos.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {m === 'fastapi' && (
                  <p className="mt-3 text-xs text-neutral-400">Modo directo: este resultado no se guardó en el historial.</p>
                )}

                <div className="flex flex-wrap justify-end gap-3 mt-4">
                  {doc.requiereAuditoria && puedeAuditar && m === 'spring' && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/auditoria')} leftIcon={<ShieldCheck className="w-4 h-4" />}>
                      Ir a auditoría
                    </Button>
                  )}
                  <Button size="sm" onClick={() => verDetalle(doc)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Ver detalle
                  </Button>
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
