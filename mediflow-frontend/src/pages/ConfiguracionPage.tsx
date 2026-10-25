import { useEffect, useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Siren,
  Route,
  Plug,
  Plus,
  X,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Badge, Button, Card, Input, Select, useToastHelpers } from '../components/ui';
import { SERVICE_URLS, estadoDelAgente, mensajeError } from '../lib/api';
import {
  TIPOS_DOCUMENTO,
  cargarConfig,
  cargarConfigServidor,
  guardarConfig,
  restablecerConfig,
  type DestinoRuta,
  type TriageConfig,
} from '../lib/triageConfig';

const nuevoId = () => `dest-${Math.random().toString(36).slice(2, 8)}`;

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 ${
        checked ? 'bg-brand-500' : 'bg-neutral-300'
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function ConfiguracionPage() {
  const { success, info, error: toastError } = useToastHelpers();
  const [cfg, setCfg] = useState<TriageConfig>(() => cargarConfig());
  const [guardada, setGuardada] = useState<string>(() => JSON.stringify(cargarConfig()));
  const [guardando, setGuardando] = useState(false);
  const [nuevaPalabra, setNuevaPalabra] = useState('');
  const [servicios, setServicios] = useState<{ spring: boolean; fastapi: boolean } | null>(null);
  const [probando, setProbando] = useState(false);
  const [sinServidor, setSinServidor] = useState<string | null>(null);

  const hayCambios = useMemo(() => JSON.stringify(cfg) !== guardada, [cfg, guardada]);

  // Las reglas vigentes viven en el servidor; la copia local solo evita una pantalla vacía mientras carga.
  useEffect(() => {
    cargarConfigServidor()
      .then((servidor) => {
        setCfg(servidor);
        setGuardada(JSON.stringify(servidor));
      })
      .catch((e) => setSinServidor(mensajeError(e, 'No se pudo leer la configuración del servidor.')));
  }, []);

  // Aviso al cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!hayCambios) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hayCambios]);

  const umbralPct = Math.round(cfg.umbralConfianza * 100);

  const agregarPalabra = () => {
    const p = nuevaPalabra.trim().toLowerCase();
    if (!p) return;
    if (cfg.palabrasUrgencia.some((x) => x.toLowerCase() === p)) {
      toastError('Duplicada', 'Esa palabra ya está en la lista.');
      return;
    }
    setCfg((c) => ({ ...c, palabrasUrgencia: [...c.palabrasUrgencia, p] }));
    setNuevaPalabra('');
  };

  const quitarPalabra = (p: string) =>
    setCfg((c) => ({ ...c, palabrasUrgencia: c.palabrasUrgencia.filter((x) => x !== p) }));

  const actualizarDestino = (id: string, cambios: Partial<DestinoRuta>) =>
    setCfg((c) => ({ ...c, destinos: c.destinos.map((d) => (d.id === id ? { ...d, ...cambios } : d)) }));

  const agregarDestino = () =>
    setCfg((c) => ({
      ...c,
      destinos: [...c.destinos, { id: nuevoId(), nombre: '', tipoDocumento: TIPOS_DOCUMENTO[0], activo: true }],
    }));

  const quitarDestino = (id: string) => setCfg((c) => ({ ...c, destinos: c.destinos.filter((d) => d.id !== id) }));

  const guardar = async () => {
    const vacios = cfg.destinos.filter((d) => !d.nombre.trim());
    if (vacios.length) {
      toastError('Destino sin nombre', 'Completa el nombre de todos los destinos antes de guardar.');
      return;
    }
    const nombresActivos = cfg.destinos.filter((d) => d.activo);
    if (!nombresActivos.some((d) => d.nombre === 'Cola_Revision_Humana')) {
      toastError('Falta la cola de revisión', 'Debe existir un destino activo llamado Cola_Revision_Humana para los casos ambiguos.');
      return;
    }
    setGuardando(true);
    const limpio: TriageConfig = { ...cfg, destinos: cfg.destinos.map((d) => ({ ...d, nombre: d.nombre.trim() })) };
    try {
      const guardadaServidor = await guardarConfig(limpio);
      setCfg(guardadaServidor);
      setGuardada(JSON.stringify(guardadaServidor));
      setSinServidor(null);
      success('Reglas aplicadas al agente', 'Los próximos documentos se procesan con esta configuración.');
    } catch (e) {
      toastError('No se pudo guardar', mensajeError(e, 'El servidor rechazó la configuración.'));
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = () => {
    setCfg(restablecerConfig());
    info('Valores por defecto cargados', 'Pulsa Guardar para aplicarlos al agente.');
  };

  const probar = async () => {
    setProbando(true);
    setServicios(await estadoDelAgente());
    setProbando(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-neutral-600 text-[15px] max-w-2xl">
            Ajusta umbrales, urgencias y destinos sin tocar el código: el agente los aplica en cada documento nuevo.
          </p>
          {cfg.actualizadoPor && cfg.fechaActualizacion && (
            <p className="text-xs text-neutral-400 mt-1">
              Último cambio: {cfg.actualizadoPor}, {new Date(cfg.fechaActualizacion).toLocaleString('es-CO')}
            </p>
          )}
          {sinServidor && (
            <p className="text-xs text-warning-700 mt-1">Mostrando la última copia guardada en este navegador: {sinServidor}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hayCambios && <Badge variant="warning" dot>Cambios sin guardar</Badge>}
          <Button variant="outline" size="sm" onClick={restablecer} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Restablecer
          </Button>
          <Button size="sm" onClick={guardar} loading={guardando} disabled={!hayCambios} leftIcon={<Save className="w-4 h-4" />}>
            Guardar
          </Button>
        </div>
      </div>

      {/* Umbral */}
      <Card variant="default" padding="lg">
        <h2 className="font-bold text-neutral-900 flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-5 h-5 text-brand-500" />
          Umbral de confianza
        </h2>
        <p className="text-sm text-neutral-500 mb-5">
          Si el agente clasifica con una confianza menor a este valor, el documento pasa a revisión humana.
        </p>
        <div className="flex items-center gap-5">
          <input
            type="range"
            min={30}
            max={95}
            step={5}
            value={umbralPct}
            onChange={(e) => setCfg((c) => ({ ...c, umbralConfianza: Number(e.target.value) / 100 }))}
            className="flex-1 accent-brand-500"
            aria-label="Umbral de confianza"
          />
          <span className="w-16 text-right text-2xl font-extrabold text-neutral-950 tabular-nums">{umbralPct}%</span>
        </div>
        <p className="mt-3 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
          {`Con este valor, un documento con 58% de confianza ${umbralPct > 58 ? 'iría a auditoría humana' : 'se procesaría automáticamente'}, y uno con ${Math.min(umbralPct + 5, 100)}% se procesaría automáticamente.`}
        </p>
      </Card>

      {/* Urgencia */}
      <Card variant="default" padding="lg">
        <h2 className="font-bold text-neutral-900 flex items-center gap-2 mb-1">
          <Siren className="w-5 h-5 text-danger-500" />
          Términos de urgencia
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          El agente marca como urgente (y alerta a la guardia) todo documento que mencione alguno de estos términos.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {cfg.palabrasUrgencia.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-danger-50 text-danger-700 text-sm font-medium">
              {p}
              <button
                type="button"
                onClick={() => quitarPalabra(p)}
                className="p-0.5 rounded-full hover:bg-danger-100"
                aria-label={`Quitar ${p}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {cfg.palabrasUrgencia.length === 0 && <p className="text-sm text-neutral-400">No hay términos configurados.</p>}
        </div>
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Agregar término (ej. convulsión)"
            value={nuevaPalabra}
            onChange={(e) => setNuevaPalabra(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                agregarPalabra();
              }
            }}
          />
          <Button variant="outline" onClick={agregarPalabra} leftIcon={<Plus className="w-4 h-4" />}>
            Agregar
          </Button>
        </div>
      </Card>

      {/* Destinos */}
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2">
            <Route className="w-5 h-5 text-brand-500" />
            Destinos de enrutamiento
          </h2>
          <Button variant="outline" size="sm" onClick={agregarDestino} leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo destino
          </Button>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Define a qué cola va cada tipo de documento. El tipo &quot;Cualquiera&quot; se usa para urgencias y revisión humana.
        </p>
        <div className="space-y-3">
          {cfg.destinos.map((d) => (
            <div key={d.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end p-3 rounded-xl border border-neutral-100">
              <Input label="Nombre del destino" value={d.nombre} onChange={(e) => actualizarDestino(d.id, { nombre: e.target.value })} placeholder="Cola_Ejemplo" />
              <Select
                label="Tipo de documento"
                value={d.tipoDocumento}
                onChange={(e) => actualizarDestino(d.id, { tipoDocumento: e.target.value })}
                options={[{ value: '*', label: 'Cualquiera' }, ...TIPOS_DOCUMENTO.map((t) => ({ value: t, label: t }))]}
              />
              <div className="flex items-center gap-2 pb-2.5">
                <Switch checked={d.activo} onChange={(v) => actualizarDestino(d.id, { activo: v })} label={`Activar ${d.nombre || 'destino'}`} />
                <span className="text-sm text-neutral-600">{d.activo ? 'Activo' : 'Inactivo'}</span>
              </div>
              <button
                type="button"
                onClick={() => quitarDestino(d.id)}
                className="p-2.5 mb-0.5 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50"
                aria-label={`Eliminar ${d.nombre || 'destino'}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Conexiones */}
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2">
            <Plug className="w-5 h-5 text-brand-500" />
            Conexiones
          </h2>
          <Button variant="outline" size="sm" onClick={probar} loading={probando} leftIcon={<Loader2 className="w-4 h-4" />}>
            Probar conexión
          </Button>
        </div>
        <dl className="space-y-3 text-sm">
          {([
            ['API principal (Spring Boot)', SERVICE_URLS.spring, servicios?.spring],
            ['Motor de IA (FastAPI)', `${SERVICE_URLS.fastapi} · o a través de la API principal`, servicios?.fastapi],
          ] as const).map(([nombre, url, ok]) => (
            <div key={nombre} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-50 rounded-lg">
              <div>
                <dt className="font-medium text-neutral-900">{nombre}</dt>
                <dd className="font-mono text-xs text-neutral-500">{url}</dd>
              </div>
              {ok === undefined ? (
                <Badge variant="neutral">Sin probar</Badge>
              ) : ok ? (
                <Badge variant="success" dot><CheckCircle2 className="w-3.5 h-3.5 mr-1" />En línea</Badge>
              ) : (
                <Badge variant="danger" dot><XCircle className="w-3.5 h-3.5 mr-1" />Sin conexión</Badge>
              )}
            </div>
          ))}
        </dl>
        <p className="text-xs text-neutral-400 mt-3">
          En producción el motor de IA es privado: su estado se consulta a través de la API principal. En desarrollo, las URLs
          se definen en el .env (VITE_SPRING_BOOT_URL y VITE_FASTAPI_URL).
        </p>
      </Card>
    </div>
  );
}
