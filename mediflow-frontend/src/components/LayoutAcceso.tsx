/**
 * Plantilla de las pantallas de acceso: formulario a la izquierda y, a la derecha,
 * el grafo del agente recorriendo los tres escenarios sobre la aurora de marca.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Eye, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import GrafoAgente, { useCicloEscenarios, type RutaAgente } from './GrafoAgente';
import { cn } from '../lib/design-system';

const RUTAS: { ruta: RutaAgente; texto: string; punto: string }[] = [
  { ruta: 'estandar', texto: 'Receta completa → Farmacia', punto: 'bg-success-500' },
  { ruta: 'urgencia', texto: 'TEP agudo → Emergencias + alerta', punto: 'bg-danger-500' },
  { ruta: 'revision_humana', texto: 'Orden ilegible → Revisión humana', punto: 'bg-warning-500' },
];

const PUNTOS = [
  { Icono: Eye, texto: 'Cada decisión con su traza, paso a paso.' },
  { Icono: ShieldCheck, texto: 'Lo dudoso siempre lo decide una persona.' },
  { Icono: Bell, texto: 'Los casos urgentes alertan a la guardia.' },
];

export default function LayoutAcceso({ titulo, subtitulo, children, pie }: { titulo: string; subtitulo: string; children: ReactNode; pie: ReactNode }) {
  const { escenario, paso, indice } = useCicloEscenarios(RUTAS, 420, 2200);

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] bg-white">
      {/* Formulario */}
      <div className="relative flex flex-col px-6 sm:px-12 py-8">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Volver al inicio"><Logo /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-ink-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-[400px] animate-in">
            <h1 className="text-3xl sm:text-[34px] font-bold text-ink-900 tracking-tight">{titulo}</h1>
            <p className="mt-2 text-neutral-500">{subtitulo}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-8 text-sm text-neutral-500">{pie}</div>
          </div>
        </div>
        <p className="text-xs text-neutral-400">Hackathon ONE G10 · Equipo 13 LATAM</p>
      </div>

      {/* Panel de marca */}
      <aside className="hidden lg:flex bg-aurora m-3 rounded-[28px] flex-col justify-between p-12">
        <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-ink text-xs text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-aqua-400 animate-pulse" /> Agente en vivo
          </span>
          <h2 className="mt-6 text-4xl xl:text-[44px] leading-[1.1] font-bold text-white text-balance">
            Cada documento, en el <span className="text-gradient-aurora">lugar correcto</span>.
          </h2>
        </div>

        <div className="relative">
          <div className="rounded-3xl glass-ink p-5">
            <GrafoAgente tono="oscuro" ruta={escenario.ruta} paso={paso} />
            <div className="mt-2 flex items-center justify-center gap-5 text-xs">
              {RUTAS.map((r, i) => (
                <span key={r.ruta} className={cn('flex items-center gap-2 transition-colors', i === indice ? 'text-white' : 'text-white/35')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', r.punto)} /> {r.texto}
                </span>
              ))}
            </div>
          </div>
        </div>

        <ul className="relative grid grid-cols-3 gap-4">
          {PUNTOS.map((p) => (
            <li key={p.texto} className="text-sm text-white/60">
              <p.Icono className="w-5 h-5 text-aqua-300 mb-2" />
              {p.texto}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
