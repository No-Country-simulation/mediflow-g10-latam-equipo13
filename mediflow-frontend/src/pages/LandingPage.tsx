import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Brain,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Code2,
  Database,
  FileText,
  GitBranch,
  Github,
  KeyRound,
  Layers,
  Lock,
  PencilLine,
  PlayCircle,
  Route,
  ScanText,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  X,
  type LucideIcon,
} from 'lucide-react';
import Logo from '../components/Logo';
import GrafoAgente, { useCicloEscenarios, type RutaAgente } from '../components/GrafoAgente';
import { cn } from '../lib/design-system';
import { useRevelar } from '../lib/useRevelar';

interface Escenario {
  id: string;
  etiqueta: string;
  titulo: string;
  canal: string;
  extracto: string;
  tipo: string;
  confianza: number;
  destino: string;
  motivo: string;
  ruta: RutaAgente;
}

// Los mismos 3 casos sintéticos que trae la pantalla "Casos de prueba" y el endpoint /demo del agente.
const ESCENARIOS: Escenario[] = [
  {
    id: 'rutina',
    etiqueta: 'Rutina',
    titulo: 'Receta estándar',
    canal: 'Consulta externa',
    extracto: 'Rp: Paracetamol 500 mg c/8 h · Ibuprofeno 400 mg c/12 h · Dx: cefalea tensional (G44.2)',
    tipo: 'Receta',
    confianza: 0.96,
    destino: 'Farmacia_Hospitalaria',
    motivo: 'Datos completos y sin señales de urgencia: sigue el flujo estándar.',
    ruta: 'estandar',
  },
  {
    id: 'urgencia',
    etiqueta: 'Urgencia',
    titulo: 'Informe radiológico',
    canal: 'Guardia de emergencias',
    extracto: 'Hallazgos: defecto de llenado en arteria pulmonar derecha, compatible con TEP agudo.',
    tipo: 'Informe de Estudio por Imágenes',
    confianza: 0.97,
    destino: 'Cola_Emergencia_Medica',
    motivo: 'Hallazgo crítico (TEP agudo): se deriva a emergencias y se alerta a la guardia.',
    ruta: 'urgencia',
  },
  {
    id: 'ambiguo',
    etiqueta: 'Ambiguo',
    titulo: 'Orden ilegible',
    canal: 'Admisión',
    extracto: 'Pcte: [ilegible] · Dr/a: firma ilegible · Estudio: ec... [borrado] abdo?',
    tipo: 'Orden de Procedimiento',
    confianza: 0.12,
    destino: 'Cola_Revision_Humana',
    motivo: 'Paciente ilegible y estudio incompleto: la decisión la toma un auditor.',
    ruta: 'revision_humana',
  },
];

const ESTILO_RUTA: Record<RutaAgente, { punto: string; chip: string; texto: string; barra: string }> = {
  estandar: { punto: 'bg-success-500', chip: 'bg-success-500/15 text-success-200 ring-success-500/30', texto: 'text-success-600', barra: 'from-success-500 to-aqua-400' },
  urgencia: { punto: 'bg-danger-500', chip: 'bg-danger-500/15 text-danger-200 ring-danger-500/30', texto: 'text-danger-600', barra: 'from-danger-500 to-warning-500' },
  revision_humana: { punto: 'bg-warning-500', chip: 'bg-warning-500/15 text-warning-200 ring-warning-500/30', texto: 'text-warning-600', barra: 'from-warning-500 to-danger-500' },
};

const HECHOS = [
  { valor: '5', texto: 'tipos de documento clínico reconocidos' },
  { valor: '9', texto: 'nodos en el grafo de decisión' },
  { valor: '3', texto: 'rutas: estándar, urgencia y revisión humana' },
  { valor: '137', texto: 'pruebas automáticas en el backend' },
];

const PASOS: { Icono: LucideIcon; titulo: string; texto: string }[] = [
  { Icono: UploadCloud, titulo: 'Ingesta', texto: 'PDF, foto de una receta, escaneo, texto o JSON. El original queda guardado en OCI.' },
  { Icono: ScanText, titulo: 'Extracción', texto: 'Gemini lee el documento y devuelve paciente, médico, CIE-10, medicamentos y dosis.' },
  { Icono: GitBranch, titulo: 'Decisión', texto: 'Reglas explícitas evalúan confianza, urgencia y medicamentos de alto riesgo.' },
  { Icono: Route, titulo: 'Acción', texto: 'Enruta al departamento, alerta a la guardia o deriva a un auditor humano.' },
];

const PILA = [
  { Icono: Layers, nombre: 'Interfaz', tec: 'React · TypeScript · Tailwind' },
  { Icono: Server, nombre: 'API principal', tec: 'Spring Boot 4 · JWT · MySQL' },
  { Icono: Brain, nombre: 'Agente', tec: 'FastAPI · LangGraph · Pydantic' },
  { Icono: Cloud, nombre: 'Nube e IA', tec: 'Gemini · OCI Object Storage' },
];

function PuntoVivo({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-aqua-400 animate-pulse-ring" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-aqua-400" />
    </span>
  );
}

function AnilloConfianza({ valor, color, tamano = 64 }: { valor: number; color: string; tamano?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" width={tamano} height={tamano} className="-rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - valor)} style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.65,.3,1)' }} />
    </svg>
  );
}

const COLOR_ANILLO: Record<RutaAgente, string> = { estandar: '#12b76a', urgencia: '#f04438', revision_humana: '#f79009' };

export default function LandingPage() {
  const navigate = useNavigate();
  const { escenario, indice, paso, irA } = useCicloEscenarios(ESCENARIOS);
  const [conScroll, setConScroll] = useState(false);
  useRevelar();

  useEffect(() => {
    const alDesplazar = () => setConScroll(window.scrollY > 24);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  const resuelto = paso >= 7;
  const estilo = ESTILO_RUTA[escenario.ruta];

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* ===================== Navegación ===================== */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          conScroll ? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Logo tono="oscuro" />
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            {[
              ['Cómo funciona', '#como-funciona'],
              ['Escenarios', '#escenarios'],
              ['Capacidades', '#capacidades'],
              ['Arquitectura', '#arquitectura'],
            ].map(([texto, href]) => (
              <a key={href} href={href} className="hover:text-white transition-colors">
                {texto}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => navigate('/registro')}
              className="shine inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-ink-950 bg-white hover:bg-white/90 shadow-[0_8px_30px_-8px_rgba(255,255,255,0.45)] transition-colors"
            >
              Crear cuenta <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>

      {/* ===================== Hero ===================== */}
      <section className="bg-aurora pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2.5 pl-2.5 pr-4 py-1.5 rounded-full glass-ink text-[13px] text-white/80 animate-in">
              <PuntoVivo />
              Agente autónomo de triaje clínico · Hackathon ONE G10
            </div>
            <h1 className="mt-7 text-[40px] leading-[1.05] sm:text-6xl lg:text-7xl font-bold text-white tracking-tight text-balance animate-in-delayed">
              El agente que lee, entiende y <span className="text-gradient-aurora">enruta</span> cada documento clínico.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto text-pretty animate-in-delayed stagger-2">
              Clasifica recetas, informes, órdenes, epicrisis y certificados con IA multimodal, detecta urgencias,
              deriva lo dudoso a un auditor humano y explica cada decisión paso a paso.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-in-delayed stagger-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="shine w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-500 via-[#3f8cf5] to-aqua-500 shadow-[0_18px_50px_-12px_rgba(91,91,240,0.8)] hover:brightness-110 transition-all"
              >
                Probar MediFlow <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#escenarios"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-white/85 glass-ink hover:bg-white/[0.08] transition-colors"
              >
                <PlayCircle className="w-5 h-5" /> Ver los 3 escenarios
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] font-mono uppercase tracking-[0.14em] text-white/35 animate-in-delayed stagger-4">
              {['Gemini multimodal', 'LangGraph', 'Spring Boot', 'FastAPI', 'OCI Object Storage'].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>

          {/* Consola del agente: el grafo real recorriendo los 3 escenarios */}
          <div className="relative mt-16 lg:mt-20 animate-in-delayed stagger-5">
            <div className="absolute -inset-x-8 -inset-y-6 bg-gradient-to-r from-brand-500/20 via-transparent to-aqua-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative rounded-[28px] glass-ink overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="w-3 h-3 rounded-full bg-white/15" />
                    <span className="w-3 h-3 rounded-full bg-white/15" />
                    <span className="w-3 h-3 rounded-full bg-white/15" />
                  </div>
                  <span className="font-mono text-xs text-white/45">agente-triaje · grafo de decisión</span>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5" role="tablist" aria-label="Escenarios de demostración">
                  {ESCENARIOS.map((e, i) => (
                    <button
                      key={e.id}
                      type="button"
                      role="tab"
                      aria-selected={i === indice}
                      onClick={() => irA(i)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        i === indice ? 'bg-white text-ink-950 shadow' : 'text-white/55 hover:text-white'
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', ESTILO_RUTA[e.ruta].punto)} />
                      {e.etiqueta}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 sm:px-8 pt-6 pb-2">
                <GrafoAgente tono="oscuro" ruta={escenario.ruta} paso={paso} />
              </div>

              <div className="grid md:grid-cols-[1.1fr_1fr] gap-px bg-white/10 border-t border-white/10">
                <div className="bg-ink-950/60 p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs text-white/45">
                    <FileText className="w-3.5 h-3.5" /> Documento · {escenario.canal}
                  </div>
                  <p className="mt-2 font-display text-white font-semibold">{escenario.titulo}</p>
                  <p className="mt-2 font-mono text-[13px] leading-relaxed text-white/60">{escenario.extracto}</p>
                </div>
                <div className="bg-ink-950/60 p-5 sm:p-6 flex items-center gap-5">
                  <div className="relative shrink-0 text-white">
                    <AnilloConfianza valor={resuelto ? escenario.confianza : 0} color={COLOR_ANILLO[escenario.ruta]} />
                    <span className="absolute inset-0 flex items-center justify-center kpi-number text-sm font-bold text-white">
                      {resuelto ? `${Math.round(escenario.confianza * 100)}%` : '…'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-white/45">{resuelto ? 'Decisión del agente' : 'Analizando…'}</div>
                    <div
                      className={cn(
                        'mt-1.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ring-1 font-mono text-xs transition-opacity duration-500',
                        estilo.chip,
                        resuelto ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      → {escenario.destino}
                    </div>
                    <p className={cn('mt-2 text-sm text-white/65 transition-opacity duration-500', resuelto ? 'opacity-100' : 'opacity-0')}>
                      {escenario.motivo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Hechos ===================== */}
      <section className="relative border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid grid-cols-2 lg:grid-cols-4">
          {HECHOS.map((h, i) => (
            <div key={h.texto} className={cn('reveal py-10 px-4 sm:px-8 border-neutral-100', i % 2 === 1 && 'border-l', i === 2 && 'lg:border-l')}
              style={{ transitionDelay: `${i * 80}ms` } as CSSProperties}>
              <div className="kpi-number text-5xl font-bold bg-gradient-to-br from-ink-900 to-brand-600 bg-clip-text text-transparent">{h.valor}</div>
              <p className="mt-2 text-sm text-neutral-500 max-w-[16rem]">{h.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== Cómo funciona ===================== */}
      <section id="como-funciona" className="relative py-24 lg:py-32 scroll-mt-16">
        <div className="absolute inset-0 bg-grid-light" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
          <div className="reveal max-w-2xl">
            <span className="text-sm font-semibold text-brand-600">Cómo funciona</span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-ink-900 text-balance">
              De la imagen borrosa a una decisión que se puede auditar.
            </h2>
            <p className="mt-4 text-lg text-neutral-500">
              La IA extrae; las reglas deciden. Así cada ruta es predecible, explicable y configurable.
            </p>
          </div>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            <div className="hidden lg:block absolute top-9 left-[12%] right-[12%] h-px bg-gradient-to-r from-brand-200 via-aqua-300 to-brand-200" aria-hidden="true" />
            {PASOS.map((p, i) => (
              <div key={p.titulo} className="reveal relative" style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}>
                <div className="relative w-[72px] h-[72px] rounded-2xl bg-white border-aurora shadow-glow flex items-center justify-center">
                  <p.Icono className="w-7 h-7 text-brand-600" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink-900 text-white text-xs font-bold flex items-center justify-center kpi-number">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-ink-900">{p.titulo}</h3>
                <p className="mt-2 text-neutral-500 leading-relaxed">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Escenarios ===================== */}
      <section id="escenarios" className="py-24 lg:py-32 bg-neutral-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="reveal text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-brand-600">Los 3 escenarios del desafío</span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-ink-900 text-balance">Mismo agente, tres decisiones distintas.</h2>
            <p className="mt-4 text-lg text-neutral-500">Documentos sintéticos procesados por el grafo real. Pruébalos en la pantalla “Casos de prueba”.</p>
          </div>
          <div className="mt-14 grid lg:grid-cols-3 gap-6">
            {ESCENARIOS.map((e, i) => {
              const est = ESTILO_RUTA[e.ruta];
              return (
                <article key={e.id} className="reveal lift group rounded-3xl bg-white border border-neutral-200/70 shadow-md overflow-hidden flex flex-col"
                  style={{ transitionDelay: `${i * 100}ms` } as CSSProperties}>
                  <div className="p-6 pb-0">
                    <div className="flex items-center justify-between">
                      <span className={cn('inline-flex items-center gap-2 text-xs font-semibold', est.texto)}>
                        <span className={cn('w-2 h-2 rounded-full', est.punto)} /> {e.etiqueta}
                      </span>
                      <span className="text-xs text-neutral-400">{e.canal}</span>
                    </div>
                    {/* El documento, como papel */}
                    <div className="mt-5 relative rounded-xl bg-[repeating-linear-gradient(transparent,transparent_23px,#eef1f6_24px)] border border-neutral-200 p-4 pt-3 shadow-inner">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        <FileText className="w-3.5 h-3.5" /> {e.titulo}
                      </div>
                      <p className="mt-2 font-mono text-[12.5px] leading-6 text-neutral-700">{e.extracto}</p>
                    </div>
                  </div>
                  <div className="flex justify-center py-3 text-neutral-300" aria-hidden="true">
                    <svg width="24" height="28" viewBox="0 0 24 28"><path d="M12 0v22m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                  <div className="mt-auto m-3 mt-0 rounded-2xl bg-ink-900 text-white p-5 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <AnilloConfianza valor={e.confianza} color={COLOR_ANILLO[e.ruta]} tamano={58} />
                      <span className="absolute inset-0 flex items-center justify-center kpi-number text-[13px] font-bold">{Math.round(e.confianza * 100)}%</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-white/45">{e.tipo}</div>
                      <div className="mt-1 font-mono text-[13px] text-white truncate">→ {e.destino}</div>
                      <p className="mt-1.5 text-xs text-white/55 leading-relaxed">{e.motivo}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== Capacidades (bento) ===================== */}
      <section id="capacidades" className="py-24 lg:py-32 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="reveal max-w-2xl">
            <span className="text-sm font-semibold text-brand-600">Capacidades</span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-ink-900 text-balance">Todo lo que un equipo clínico necesita, sin perder el control.</h2>
          </div>

          <div className="mt-14 grid md:grid-cols-6 gap-5">
            {/* Extracción estructurada */}
            <div className="reveal md:col-span-4 rounded-3xl bg-ink-900 text-white p-7 overflow-hidden relative">
              <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
              <div className="relative grid lg:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-aqua-300" /></div>
                  <h3 className="mt-5 text-2xl font-semibold">Extracción estructurada</h3>
                  <p className="mt-2 text-white/60">De una foto o un PDF a un JSON validado con Pydantic: paciente, médico y matrícula, diagnóstico, CIE-10, medicamentos y dosis.</p>
                </div>
                <pre className="rounded-2xl bg-black/30 border border-white/10 p-4 font-mono text-[12px] leading-relaxed text-white/80 overflow-x-auto scrollbar-none">
{`{
  `}<span className="text-aqua-300">"tipo_documento"</span>{`: `}<span className="text-warning-200">"Receta"</span>{`,
  `}<span className="text-aqua-300">"matricula"</span>{`: `}<span className="text-warning-200">"MP 20311"</span>{`,
  `}<span className="text-aqua-300">"cie10_sugerido"</span>{`: `}<span className="text-warning-200">"G44.2"</span>{`,
  `}<span className="text-aqua-300">"medicamentos"</span>{`: [{
    `}<span className="text-aqua-300">"nombre"</span>{`: `}<span className="text-warning-200">"Paracetamol"</span>{`,
    `}<span className="text-aqua-300">"dosis"</span>{`: `}<span className="text-warning-200">"500 mg"</span>{`
  }]
}`}
                </pre>
              </div>
            </div>

            {/* Revisión humana */}
            <div className="reveal md:col-span-2 rounded-3xl bg-white border border-neutral-200/70 shadow-md p-7 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center ring-1 ring-warning-100"><ShieldCheck className="w-5 h-5" /></div>
              <h3 className="mt-5 text-xl font-semibold text-ink-900">Revisión humana en un clic</h3>
              <p className="mt-2 text-sm text-neutral-500">Lo dudoso llega al auditor con el original al lado.</p>
              <div className="mt-auto pt-6 grid grid-cols-3 gap-2 text-xs font-semibold">
                <span className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-success-50 text-success-700"><Check className="w-4 h-4" />Aprobar</span>
                <span className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-brand-50 text-brand-700"><PencilLine className="w-4 h-4" />Corregir</span>
                <span className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-danger-50 text-danger-700"><X className="w-4 h-4" />Rechazar</span>
              </div>
            </div>

            {/* Alertas */}
            <div className="reveal md:col-span-2 rounded-3xl bg-white border border-neutral-200/70 shadow-md p-7 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center ring-1 ring-danger-100"><Bell className="w-5 h-5" /></div>
              <h3 className="mt-5 text-xl font-semibold text-ink-900">Alertas en tiempo real</h3>
              <p className="mt-2 text-sm text-neutral-500">Campana en la app y webhook a Slack, Discord o n8n.</p>
              <div className="mt-auto pt-6">
                <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-gradient-to-br from-danger-50 to-white p-3.5 shadow-sm">
                  <span className="relative mt-0.5 flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-danger-500 animate-pulse-ring" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger-500" />
                  </span>
                  <div className="text-xs">
                    <p className="font-semibold text-ink-900">Caso urgente · TEP agudo</p>
                    <p className="text-neutral-500 mt-0.5">Derivado a Cola_Emergencia_Medica</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reglas configurables */}
            <div className="reveal md:col-span-2 rounded-3xl bg-white border border-neutral-200/70 shadow-md p-7 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center ring-1 ring-brand-100"><SlidersHorizontal className="w-5 h-5" /></div>
              <h3 className="mt-5 text-xl font-semibold text-ink-900">Reglas que tú controlas</h3>
              <p className="mt-2 text-sm text-neutral-500">Umbral, términos de urgencia y destinos, sin tocar código.</p>
              <div className="mt-auto pt-6">
                <div className="flex justify-between text-xs text-neutral-500"><span>Umbral de confianza</span><span className="kpi-number font-semibold text-ink-900">60%</span></div>
                <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden"><div className="h-full w-[60%] rounded-full bg-aurora-line" /></div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['tep', 'infarto', 'sepsis', 'acv'].map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-danger-50 text-danger-700 text-[11px] font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Respaldo OCI */}
            <div className="reveal md:col-span-2 rounded-3xl bg-white border border-neutral-200/70 shadow-md p-7 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-aqua-50 text-aqua-700 flex items-center justify-center ring-1 ring-aqua-100"><Database className="w-5 h-5" /></div>
              <h3 className="mt-5 text-xl font-semibold text-ink-900">Respaldo en OCI</h3>
              <p className="mt-2 text-sm text-neutral-500">Buckets separados por estado, en la capa Always Free.</p>
              <div className="mt-auto pt-6 space-y-2 font-mono text-[11.5px]">
                <div className="flex items-center gap-2"><span className="px-2 py-1 rounded-md bg-neutral-100 text-neutral-600">BktRecibidos</span><ArrowRight className="w-3.5 h-3.5 text-neutral-300" /><span className="px-2 py-1 rounded-md bg-success-50 text-success-700">BktProcesados</span></div>
                <div className="flex items-center gap-2 pl-[104px]"><ArrowRight className="w-3.5 h-3.5 text-neutral-300 rotate-45 -ml-[22px]" /><span className="px-2 py-1 rounded-md bg-warning-50 text-warning-700">BktAuditoria-humana</span></div>
              </div>
            </div>

            {/* Trazabilidad */}
            <div className="reveal md:col-span-4 rounded-3xl bg-gradient-to-br from-brand-50 via-white to-aqua-50 border border-brand-100 p-7 grid lg:grid-cols-[1fr_1.2fr] gap-6 items-center">
              <div>
                <div className="w-11 h-11 rounded-xl bg-white text-brand-600 flex items-center justify-center shadow-sm ring-1 ring-brand-100"><ClipboardCheck className="w-5 h-5" /></div>
                <h3 className="mt-5 text-2xl font-semibold text-ink-900">Cada decisión, explicada</h3>
                <p className="mt-2 text-neutral-500">La traza del grafo muestra qué observó cada nodo, por qué eligió la ruta y cuánto tardó.</p>
              </div>
              <ol className="space-y-2.5">
                {[
                  ['Extracción con IA', 'Receta · confianza 0,96'],
                  ['Validación clínica', 'Sin observaciones'],
                  ['Score de confianza', '0,96 ≥ umbral 0,60'],
                  ['Detección de urgencia', 'Sin signos de urgencia'],
                  ['Enrutamiento', 'Farmacia_Hospitalaria'],
                ].map(([titulo, resultado], i) => (
                  <li key={titulo} className="flex items-center gap-3 rounded-xl bg-white/80 border border-white px-3.5 py-2.5 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 text-white text-[11px] font-bold flex items-center justify-center kpi-number">{i + 1}</span>
                    <span className="text-sm font-medium text-ink-900">{titulo}</span>
                    <span className="ml-auto text-xs text-neutral-500 font-mono truncate">{resultado}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Arquitectura ===================== */}
      <section id="arquitectura" className="bg-aurora py-24 lg:py-32 scroll-mt-16">
        <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
          <div className="reveal max-w-2xl">
            <span className="text-sm font-semibold text-aqua-300">Arquitectura</span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-white text-balance">Cuatro capas, un solo flujo.</h2>
            <p className="mt-4 text-lg text-white/55">Se levanta completo con un comando: <code className="font-mono text-aqua-200">docker compose up</code>.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-1/2 left-[8%] right-[8%] h-px bg-gradient-to-r from-brand-400/0 via-aqua-300/60 to-brand-400/0" aria-hidden="true" />
            {PILA.map((c, i) => (
              <div key={c.nombre} className="reveal relative glass-ink rounded-2xl p-6" style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-aqua-500 flex items-center justify-center shadow-glow">
                  <c.Icono className="w-5 h-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{c.nombre}</h3>
                <p className="mt-1 text-sm text-white/55">{c.tec}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {[
              { Icono: Lock, titulo: 'Privacidad', texto: 'Sin datos clínicos en los logs y el archivo se borra de la IA al terminar.' },
              { Icono: KeyRound, titulo: 'Seguridad', texto: 'Sesión JWT, contraseñas con BCrypt y permisos por rol en cada endpoint.' },
              { Icono: Code2, titulo: 'Abierto', texto: 'Swagger en las dos APIs y pruebas automáticas en cada capa.' },
            ].map((p) => (
              <div key={p.titulo} className="reveal flex items-start gap-3">
                <p.Icono className="w-5 h-5 text-aqua-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">{p.titulo}</p>
                  <p className="text-sm text-white/50">{p.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Llamado final ===================== */}
      <section className="py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          <div className="reveal relative overflow-hidden rounded-[32px] bg-ink-900 px-8 py-16 sm:px-16 text-center">
            <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-brand-500/40 to-aqua-500/30 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-balance">Menos transcripción. Más tiempo para el paciente.</h2>
              <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto">Sube un documento y mira al agente decidir, paso a paso.</p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="shine w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-ink-950 bg-white hover:bg-white/90 transition-colors"
                >
                  Entrar a MediFlow <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/registro')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-white/85 glass-ink hover:bg-white/[0.08] transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" /> Crear una cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Pie ===================== */}
      <footer className="border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo subtitle="Triaje clínico autónomo" />
          <p className="text-sm text-neutral-500 text-center">Hackathon ONE G10 · Oracle Next Education &amp; Alura · Equipo 13 LATAM</p>
          <a
            href="https://github.com/No-Country-simulation/mediflow-g10-latam-equipo13"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-ink-900"
          >
            <Github className="w-4 h-4" /> Código en GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
