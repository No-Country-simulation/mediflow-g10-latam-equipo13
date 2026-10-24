import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  RefreshCw,
  ShieldAlert,
  Siren,
  UploadCloud,
} from 'lucide-react';
import { Card, StatCard, Skeleton, SkeletonCard, SkeletonStatCard, SkeletonTable } from '../components/ui';
import { rutaDeDocumento, type RutaAgente } from '../components/GrafoAgente';
import { cn } from '../lib/design-system';
import { springApi, springToUnificado, useAuth, type DocumentoUnificado } from '../lib/api';
import { exportarHistorialJson } from '../lib/exportar';

const RUTAS: { ruta: RutaAgente; nombre: string; color: string; clase: string }[] = [
  { ruta: 'estandar', nombre: 'Flujo estándar', color: '#12b76a', clase: 'bg-success-500' },
  { ruta: 'urgencia', nombre: 'Emergencias', color: '#f04438', clase: 'bg-danger-500' },
  { ruta: 'revision_humana', nombre: 'Revisión humana', color: '#f79009', clase: 'bg-warning-500' },
];

const claveDia = (fecha: Date) => `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;

function hace(fechaIso: string) {
  const ms = Date.now() - new Date(fechaIso).getTime();
  if (Number.isNaN(ms)) return '';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(fechaIso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function Anillo({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const id = `anillo-${useId().replace(/:/g, '')}`;
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4 rounded-2xl glass-ink px-5 py-4">
      <div className="relative">
        <svg viewBox="0 0 72 72" className="w-[72px] h-[72px] -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8080fb" />
              <stop offset="1" stopColor="#24e0c4" />
            </linearGradient>
          </defs>
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - valor)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.65,.3,1)' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center kpi-number text-[15px] font-bold text-white">{Math.round(valor * 100)}%</span>
      </div>
      <p className="text-sm text-white/60 leading-snug">{etiqueta}</p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoUnificado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cargarDatos = async () => {
    try {
      setError(null);
      const springResponse = await springApi.getDocumentos(0, 100);
      const allDocs = springResponse.content.map(springToUnificado);
      allDocs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setDocumentos(allDocs);
    } catch (e) {
      setError(e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Error al cargar datos');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const metrics = useMemo(() => {
    const total = documentos.length;
    const procesados = documentos.filter((d) => d.status === 'procesado').length;
    const enRevision = documentos.filter((d) => d.status === 'en_revision').length;
    const urgentes = documentos.filter((d) => d.prioridad === 'Urgente').length;
    const avgConfidence = total > 0 ? documentos.reduce((sum, d) => sum + d.scoreConfianza, 0) / total : 0;
    const autoRouted = documentos.filter((d) => !d.requiereAuditoria && !d.revision).length;
    return { total, procesados, enRevision, urgentes, avgConfidence, autoRate: total > 0 ? autoRouted / total : 0 };
  }, [documentos]);

  // Actividad de los últimos 7 días (en hora local).
  const dias = useMemo(() => {
    const porDia = new Map<string, { procesados: number; revision: number; urgentes: number }>();
    documentos.forEach((doc) => {
      const fecha = new Date(doc.fecha);
      if (Number.isNaN(fecha.getTime())) return;
      const k = claveDia(fecha);
      const d = porDia.get(k) ?? { procesados: 0, revision: 0, urgentes: 0 };
      if (doc.prioridad === 'Urgente') d.urgentes++;
      else if (doc.status === 'en_revision' || doc.requiereAuditoria) d.revision++;
      else d.procesados++;
      porDia.set(k, d);
    });
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - (6 - i));
      const d = porDia.get(claveDia(fecha)) ?? { procesados: 0, revision: 0, urgentes: 0 };
      return { etiqueta: fecha.toLocaleDateString('es-CO', { weekday: 'short' }), dia: fecha.getDate(), hoy: i === 6, ...d, total: d.procesados + d.revision + d.urgentes };
    });
  }, [documentos]);
  const maxDia = Math.max(1, ...dias.map((d) => d.total));

  const porRuta = useMemo(() => {
    const conteo: Record<RutaAgente, number> = { estandar: 0, urgencia: 0, revision_humana: 0 };
    documentos.forEach((d) => conteo[rutaDeDocumento(d)]++);
    return conteo;
  }, [documentos]);

  const contar = (clave: (d: DocumentoUnificado) => string) => {
    const mapa = new Map<string, number>();
    documentos.forEach((d) => {
      const k = clave(d) || 'Sin dato';
      mapa.set(k, (mapa.get(k) ?? 0) + 1);
    });
    return Array.from(mapa.entries()).map(([nombre, valor]) => ({ nombre, valor })).sort((a, b) => b.valor - a.valor).slice(0, 6);
  };
  const destinos = useMemo(() => contar((d) => d.destino), [documentos]); // eslint-disable-line react-hooks/exhaustive-deps
  const tipos = useMemo(() => contar((d) => d.tipo), [documentos]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <SkeletonCard className="lg:col-span-2" />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const totalRutas = porRuta.estandar + porRuta.urgencia + porRuta.revision_humana;
  const circunferencia = 2 * Math.PI * 52;
  let acumulado = 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in">
      {/* Bienvenida */}
      <section className="bg-aurora rounded-3xl px-7 py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <p className="text-sm text-white/50 first-letter:uppercase">{hoy}</p>
            <h2 className="mt-2 text-3xl lg:text-[40px] leading-tight font-bold text-white">
              Hola, <span className="text-gradient-aurora">{user?.nombre ?? 'equipo'}</span>
            </h2>
            <p className="mt-3 text-white/60 max-w-lg">
              {metrics.total === 0
                ? 'Todavía no hay documentos. Procesa el primero y mira al agente decidir paso a paso.'
                : `El agente procesó ${metrics.total} documento${metrics.total === 1 ? '' : 's'}: ${metrics.enRevision} esperan revisión humana y ${metrics.urgentes} ${metrics.urgentes === 1 ? 'es urgente' : 'son urgentes'}.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/procesar')}
                className="shine inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-ink-950 bg-white hover:bg-white/90 transition-colors"
              >
                <UploadCloud className="w-4 h-4" /> Procesar documento
              </button>
              <button
                type="button"
                onClick={() => exportarHistorialJson(documentos)}
                disabled={documentos.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white/85 glass-ink hover:bg-white/[0.08] transition-colors disabled:opacity-40"
              >
                <Download className="w-4 h-4" /> Exportar JSON
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/70 glass-ink hover:bg-white/[0.08] transition-colors"
                aria-label="Actualizar"
              >
                <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            <Anillo valor={metrics.avgConfidence} etiqueta="Confianza promedio" />
            <Anillo valor={metrics.autoRate} etiqueta="Sin intervención humana" />
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger-200 bg-danger-50 px-5 py-4 text-sm text-danger-700">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Documentos" value={metrics.total} icon={<FileCheck2 className="w-5 h-5" />} variant="primary" onClick={() => navigate('/historial')} />
        <StatCard title="Procesados" value={metrics.procesados} icon={<CheckCircle2 className="w-5 h-5" />} variant="success" onClick={() => navigate('/colas')} />
        <StatCard title="En revisión humana" value={metrics.enRevision} icon={<ShieldAlert className="w-5 h-5" />} variant="warning" onClick={() => navigate('/auditoria')} />
        <StatCard title="Urgentes" value={metrics.urgentes} icon={<Siren className="w-5 h-5" />} variant="danger" onClick={() => navigate('/colas')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Actividad */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-ink-900">Actividad del agente</h3>
              <p className="text-sm text-neutral-500">Documentos de los últimos 7 días, por ruta</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-brand-500 to-aqua-500" />Estándar</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warning-500" />Revisión</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-danger-500" />Urgente</span>
            </div>
          </div>
          <div className="mt-6 h-56 grid grid-cols-7 gap-3 items-end">
            {dias.map((d) => (
              <div key={`${d.etiqueta}-${d.dia}`} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className={cn('kpi-number text-xs font-semibold', d.total ? 'text-ink-900' : 'text-neutral-300')}>{d.total}</span>
                <div className="w-full max-w-[44px] flex flex-col-reverse rounded-lg overflow-hidden bg-neutral-100" style={{ height: `${Math.max((d.total / maxDia) * 100, 4)}%` }}
                  title={`${d.procesados} estándar · ${d.revision} revisión · ${d.urgentes} urgentes`}>
                  <div className="bg-gradient-to-t from-brand-500 to-aqua-400" style={{ flexGrow: d.procesados }} />
                  <div className="bg-warning-500" style={{ flexGrow: d.revision }} />
                  <div className="bg-danger-500" style={{ flexGrow: d.urgentes }} />
                </div>
                <span className={cn('text-xs capitalize', d.hoy ? 'font-semibold text-brand-600' : 'text-neutral-500')}>
                  {d.hoy ? 'Hoy' : `${d.etiqueta.replace('.', '')} ${d.dia}`}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Rutas del agente */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-ink-900">Rutas del agente</h3>
          <p className="text-sm text-neutral-500">Cómo se decidió cada documento</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative shrink-0">
              <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f3f7" strokeWidth="14" />
                {totalRutas > 0 &&
                  RUTAS.map((r) => {
                    const fraccion = porRuta[r.ruta] / totalRutas;
                    const segmento = (
                      <circle key={r.ruta} cx="60" cy="60" r="52" fill="none" stroke={r.color} strokeWidth="14"
                        strokeDasharray={`${fraccion * circunferencia} ${circunferencia}`} strokeDashoffset={-acumulado * circunferencia} />
                    );
                    acumulado += fraccion;
                    return segmento;
                  })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="kpi-number text-2xl font-bold text-ink-900">{totalRutas}</span>
                <span className="text-[11px] text-neutral-500">documentos</span>
              </div>
            </div>
            <ul className="flex-1 space-y-3">
              {RUTAS.map((r) => (
                <li key={r.ruta} className="flex items-center gap-2.5 text-sm">
                  <span className={cn('w-2.5 h-2.5 rounded-full', r.clase)} />
                  <span className="text-neutral-600">{r.nombre}</span>
                  <span className="ml-auto kpi-number font-semibold text-ink-900">{porRuta[r.ruta]}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {[
          { titulo: 'Colas de destino', sub: 'A dónde se enviaron los documentos', datos: destinos, barra: 'from-brand-500 to-aqua-400', ir: '/colas' },
          { titulo: 'Tipos de documento', sub: 'Lo que clasificó la IA', datos: tipos, barra: 'from-ink-700 to-brand-500', ir: '/historial' },
        ].map((bloque) => (
          <Card key={bloque.titulo} padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink-900">{bloque.titulo}</h3>
                <p className="text-sm text-neutral-500">{bloque.sub}</p>
              </div>
              <button type="button" onClick={() => navigate(bloque.ir)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50" aria-label={`Ver ${bloque.titulo}`}>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3.5">
              {bloque.datos.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">Sin datos todavía</p>
              ) : (
                bloque.datos.map((item) => (
                  <div key={item.nombre}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700 truncate pr-3">{item.nombre.replace(/_/g, ' ')}</span>
                      <span className="kpi-number font-semibold text-ink-900">{item.valor}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', bloque.barra)}
                        style={{ width: `${(item.valor / bloque.datos[0].valor) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Recientes */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">Documentos recientes</h3>
            <p className="text-sm text-neutral-500">Los últimos que pasaron por el agente</p>
          </div>
          <button type="button" onClick={() => navigate('/historial')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Ver historial <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {documentos.length === 0 ? (
          <div className="px-6 pb-10 pt-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-aqua-50 text-brand-600 flex items-center justify-center ring-1 ring-brand-100">
              <FileText className="w-6 h-6" />
            </div>
            <p className="mt-4 text-neutral-500">No hay documentos procesados aún.</p>
            <button type="button" onClick={() => navigate('/procesar')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
              Procesar el primero <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
            {documentos.slice(0, 8).map((doc) => {
              const ruta = RUTAS.find((r) => r.ruta === rutaDeDocumento(doc)) ?? RUTAS[0];
              return (
                <li key={String(doc.id)}>
                  <button
                    type="button"
                    onClick={() => navigate(`/documentos/${doc.id}`, { state: { documento: doc } })}
                    className="w-full grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1.4fr_1fr_8rem_6rem] items-center gap-4 px-6 py-3.5 text-left hover:bg-neutral-50/80 transition-colors"
                  >
                    <span className="relative w-10 h-10 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
                      <FileText className="w-[18px] h-[18px]" />
                      <span className={cn('absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white', ruta.clase)} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-900 truncate">{doc.tipo}</span>
                      <span className="block text-xs text-neutral-500 truncate">{doc.paciente.nombre || 'Paciente sin identificar'}</span>
                    </span>
                    <span className="hidden md:block text-xs font-mono text-neutral-600 truncate">{doc.destino || '—'}</span>
                    <span className="hidden md:flex items-center gap-2">
                      <span className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <span className={cn('block h-full rounded-full', doc.scoreConfianza >= 0.8 ? 'bg-success-500' : doc.scoreConfianza >= 0.6 ? 'bg-warning-500' : 'bg-danger-500')}
                          style={{ width: `${Math.round(doc.scoreConfianza * 100)}%` }} />
                      </span>
                      <span className="kpi-number text-xs font-semibold text-ink-900 w-8 text-right">{Math.round(doc.scoreConfianza * 100)}%</span>
                    </span>
                    <span className="text-xs text-neutral-400 text-right whitespace-nowrap">{hace(doc.fecha)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
