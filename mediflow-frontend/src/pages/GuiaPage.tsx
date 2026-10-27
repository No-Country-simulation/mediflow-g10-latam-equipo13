import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Compass, Lightbulb, Lock, Route } from 'lucide-react';
import { Card } from '../components/ui';
import { cn } from '../lib/design-system';
import { useAuth } from '../lib/api';
import { GLOSARIO, GUIAS, ORDEN_ROLES, RUTAS_AGENTE, type RolConGuia } from '../lib/guiaRoles';

export default function GuiaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const propio: RolConGuia | null = user && user.rol !== 'NO_ASIGNADO' ? user.rol : null;
  // El administrador puede leer la guía de los demás roles (también sin sesión, al revisar en desarrollo).
  const puedeVerTodas = !propio || propio === 'ADMIN';
  const [rol, setRol] = useState<RolConGuia>(propio ?? 'ADMIN');

  const guia = GUIAS[rol];
  const esPropia = rol === propio;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in">
      {/* Presentación del rol */}
      <section className="bg-aurora rounded-3xl px-7 py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-0 bg-grid-ink" aria-hidden="true" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <div>
            <p className="inline-flex items-center gap-2 text-sm text-white/50">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              {esPropia ? 'Tu guía' : 'Guía de otro rol'}
            </p>
            <h2 className="mt-2 text-3xl lg:text-[40px] leading-tight font-bold text-white">
              {esPropia ? 'Tu trabajo como ' : 'El rol '}
              <span className="text-gradient-aurora">{guia.nombre}</span>
            </h2>
            <p className="mt-3 text-white/60 max-w-lg">{guia.mision}</p>

            {puedeVerTodas && (
              <div className="mt-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">Ver la guía de</p>
                <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl glass-ink" role="group" aria-label="Rol de la guía">
                  {ORDEN_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRol(r)}
                      aria-pressed={rol === r}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400/50',
                        rol === r ? 'bg-white text-ink-950' : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                      )}
                    >
                      {GUIAS[r].nombre}
                      {r === propio && <span className="font-normal opacity-60"> (tú)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-ink rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {esPropia ? 'Puedes usar' : 'Puede usar'}
              </p>
              <ul className="mt-2.5 space-y-2">
                {guia.puede.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-white/85">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-aqua-300" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            {guia.noPuede.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">Sin acceso</p>
                <ul className="mt-2.5 space-y-2">
                  {guia.noPuede.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-sm text-white/45">
                      <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Responsabilidades */}
      <section aria-labelledby="guia-responsabilidades">
        <h2 id="guia-responsabilidades" className="font-display text-lg font-semibold text-ink-900 mb-3">
          {esPropia ? 'Qué haces en MediFlow' : 'Qué hace en MediFlow'}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {guia.responsabilidades.map(({ titulo, detalle, Icono }) => (
            <Card key={titulo} padding="lg">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icono className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{titulo}</h3>
              <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{detalle}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Paso a paso */}
      <Card padding="lg">
        <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
          <Compass className="w-5 h-5 text-brand-500" aria-hidden="true" />
          Paso a paso
        </h2>
        <ol className="mt-6 space-y-6">
          {guia.pasos.map((paso, i) => (
            <li key={paso.titulo} className="relative flex gap-4">
              {i < guia.pasos.length - 1 && (
                <span className="absolute left-4 top-10 -bottom-4 w-px bg-neutral-200" aria-hidden="true" />
              )}
              <span className="relative shrink-0 w-8 h-8 rounded-full bg-ink-900 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <h3 className="font-semibold text-ink-900">{paso.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-600 leading-relaxed max-w-3xl">{paso.detalle}</p>
                {paso.ruta && (
                  <button
                    type="button"
                    onClick={() => navigate(paso.ruta!)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                  >
                    Ir a {paso.pantalla}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cómo decide el agente */}
        <Card padding="lg">
          <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
            <Route className="w-5 h-5 text-brand-500" aria-hidden="true" />
            Cómo decide el agente
          </h2>
          <p className="mt-1 text-sm text-neutral-500">La IA extrae, las reglas deciden y, cuando hay dudas, decide una persona.</p>
          <ul className="mt-5 space-y-4">
            {RUTAS_AGENTE.map((r) => (
              <li key={r.nombre} className="flex gap-3">
                <span className={cn('mt-1.5 w-2.5 h-2.5 rounded-full shrink-0', r.punto)} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{r.nombre}</p>
                  <p className="mt-0.5 text-sm text-neutral-600 leading-relaxed">{r.detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Buenas prácticas */}
        <Card padding="lg">
          <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning-500" aria-hidden="true" />
            Buenas prácticas
          </h2>
          <ul className="mt-5 space-y-3">
            {guia.buenasPracticas.map((b) => (
              <li key={b} className="flex gap-3 text-sm text-neutral-700 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-success-500" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Glosario */}
      <Card padding="lg">
        <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-500" aria-hidden="true" />
          Glosario
        </h2>
        <dl className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {GLOSARIO.map((g) => (
            <div key={g.termino}>
              <dt className="text-sm font-semibold text-ink-900">{g.termino}</dt>
              <dd className="mt-0.5 text-sm text-neutral-600 leading-relaxed">{g.definicion}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
