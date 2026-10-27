/**
 * Asistente virtual: botón flotante que abre un mini chat para resolver dudas sobre MediFlow.
 * Las preguntas escritas las responde la IA (vía Spring, según el rol de la sesión). Las sugerencias
 * se responden al instante con respuestas guardadas, que también cubren a la IA si no responde a tiempo.
 */
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, RotateCcw, SendHorizontal, X } from 'lucide-react';
import { cn } from '../lib/design-system';
import { springApi, useAuth, type MensajeAsistente } from '../lib/api';
import type { RolConGuia } from '../lib/guiaRoles';
import {
  RESPUESTA_SIN_COINCIDENCIA,
  SUGERENCIAS,
  respuestaPorId,
  responderLocal,
  type RespuestaLocal,
} from '../lib/asistenteLocal';

interface Mensaje {
  id: number;
  autor: 'usuario' | 'asistente';
  texto: string;
  ruta?: string;
  pantalla?: string;
  /** La respuesta no vino de la IA sino de las guardadas. */
  guardada?: boolean;
}

const ESPERA_MAXIMA_MS = 25_000;
const MAX_LARGO = 500;

let siguienteId = 1;

/** Negritas con **texto**. */
function enLinea(texto: string): ReactNode[] {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-ink-900">{parte}</strong> : <Fragment key={i}>{parte}</Fragment>
  );
}

type Bloque = { tipo: 'p'; texto: string } | { tipo: 'ol' | 'ul'; items: string[] };

/** Párrafos, listas numeradas («1. ») y viñetas («- ») sin interpretar HTML. */
function Texto({ texto }: { texto: string }) {
  const bloques: Bloque[] = [];
  for (const linea of texto.split('\n')) {
    const numerada = linea.match(/^\s*\d+[.)]\s+(.*)$/);
    const item = numerada ?? linea.match(/^\s*[-•*]\s+(.*)$/);
    if (item) {
      const tipo = numerada ? 'ol' : 'ul';
      const ultimo = bloques[bloques.length - 1];
      if (ultimo && ultimo.tipo !== 'p' && ultimo.tipo === tipo) ultimo.items.push(item[1]);
      else bloques.push({ tipo, items: [item[1]] });
    } else if (linea.trim()) {
      bloques.push({ tipo: 'p', texto: linea });
    }
  }
  return (
    <div className="space-y-2">
      {bloques.map((b, i) => {
        if (b.tipo === 'p') return <p key={i}>{enLinea(b.texto)}</p>;
        const Lista = b.tipo;
        return (
          <Lista key={i} className={cn('space-y-1 pl-5', b.tipo === 'ol' ? 'list-decimal' : 'list-disc')}>
            {b.items.map((t, j) => <li key={j}>{enLinea(t)}</li>)}
          </Lista>
        );
      })}
    </div>
  );
}

export default function AsistenteVirtual() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rol: RolConGuia | null = user && user.rol !== 'NO_ASIGNADO' ? user.rol : null;
  const sugerencias = SUGERENCIAS[rol ?? 'ADMIN'];

  const [abierto, setAbierto] = useState(false);
  const [visto, setVisto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const fondo = useRef<HTMLDivElement>(null);
  const pedido = useRef<AbortController | null>(null);

  const bienvenida = `¡Hola${user?.nombre ? `, ${user.nombre}` : ''}! Soy el asistente de MediFlow. Pregúntame cómo usar una pantalla, qué puede hacer tu rol o cómo decide el agente.`;

  useEffect(() => {
    if (!abierto) return;
    setVisto(true);
    entrada.current?.focus();
    const cerrarConEscape = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [abierto]);

  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, pensando, abierto]);

  // Al salir de la aplicación se cancela la consulta en curso.
  useEffect(() => () => pedido.current?.abort(), []);

  const agregar = (m: Omit<Mensaje, 'id'>) => setMensajes((previos) => [...previos, { ...m, id: siguienteId++ }]);

  const responderGuardada = (r: RespuestaLocal | null) =>
    agregar({ autor: 'asistente', texto: r?.texto ?? RESPUESTA_SIN_COINCIDENCIA, ruta: r?.ruta, pantalla: r?.pantalla, guardada: true });

  const preguntar = async (pregunta: string, idGuardada?: string) => {
    const limpia = pregunta.trim().slice(0, MAX_LARGO);
    if (limpia.length < 2 || pensando) return;
    const historial: MensajeAsistente[] = mensajes.slice(-6).map((m) => ({ rol: m.autor, texto: m.texto }));
    agregar({ autor: 'usuario', texto: limpia });
    setTexto('');
    setPensando(true);

    if (idGuardada) {
      // Las sugerencias tienen respuesta revisada: se muestra al instante, sin gastar la IA.
      window.setTimeout(() => {
        responderGuardada(respuestaPorId(idGuardada, rol));
        setPensando(false);
      }, 450);
      return;
    }

    const control = new AbortController();
    pedido.current = control;
    const plazo = window.setTimeout(() => control.abort(), ESPERA_MAXIMA_MS);
    try {
      const respuesta = await springApi.preguntarAsistente(limpia, historial, control.signal);
      const enlace = responderLocal(limpia, rol, 3);
      agregar({ autor: 'asistente', texto: respuesta, ruta: enlace?.ruta, pantalla: enlace?.pantalla });
    } catch {
      if (pedido.current !== control) return;
      responderGuardada(responderLocal(limpia, rol));
    } finally {
      window.clearTimeout(plazo);
      if (pedido.current === control) {
        pedido.current = null;
        setPensando(false);
      }
    }
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    preguntar(texto);
  };

  const reiniciar = () => {
    pedido.current?.abort();
    pedido.current = null;
    setPensando(false);
    setMensajes([]);
    entrada.current?.focus();
  };

  const ir = (ruta: string) => {
    navigate(ruta);
    if (window.innerWidth < 640) setAbierto(false);
  };

  return (
    <>
      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente virtual de MediFlow"
          className="fixed z-[700] bottom-24 right-4 sm:right-5 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(580px,calc(100dvh-8rem))] flex flex-col overflow-hidden rounded-3xl bg-white border border-neutral-200/80 shadow-2xl animate-in"
        >
          {/* Cabecera */}
          <header className="relative shrink-0 overflow-hidden bg-ink-900 px-4 py-3.5">
            <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-aqua-500 flex items-center justify-center shadow-lg shadow-brand-900/40">
                <Bot className="w-5 h-5 text-white" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[15px] font-semibold text-white leading-tight">Asistente MediFlow</h2>
                <p className="flex items-center gap-1.5 text-xs text-white/55">
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua-400" aria-hidden="true" />
                  Responde con IA y conoce tu rol
                </p>
              </div>
              <button
                type="button"
                onClick={reiniciar}
                disabled={mensajes.length === 0}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Empezar de nuevo"
                title="Empezar de nuevo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                aria-label="Cerrar asistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Conversación */}
          <div className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-4 space-y-3" aria-live="polite">
            {[{ id: 0, autor: 'asistente' as const, texto: bienvenida }, ...mensajes].map((m) =>
              m.autor === 'usuario' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2.5 text-sm text-white whitespace-pre-wrap break-words">
                    {m.texto}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="flex items-end gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-aqua-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" aria-hidden="true" />
                  </span>
                  <div className="max-w-[85%] min-w-0">
                    <div className="rounded-2xl rounded-bl-md bg-white border border-neutral-200/80 px-3.5 py-2.5 text-sm text-neutral-700 leading-relaxed break-words shadow-xs">
                      <Texto texto={m.texto} />
                      {'ruta' in m && m.ruta && (
                        <button
                          type="button"
                          onClick={() => ir(m.ruta!)}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
                        >
                          Ir a {m.pantalla} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {'guardada' in m && m.guardada && (
                      <p className="mt-1 pl-1 text-[11px] text-neutral-400">Respuesta guardada</p>
                    )}
                  </div>
                </div>
              )
            )}

            {mensajes.length === 0 && (
              <div className="pl-9 flex flex-wrap gap-2">
                {sugerencias.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => preguntar(s.texto, s.id)}
                    className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-colors text-left"
                  >
                    {s.texto}
                  </button>
                ))}
              </div>
            )}

            {pensando && (
              <div className="flex items-end gap-2" aria-label="El asistente está escribiendo">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-aqua-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" aria-hidden="true" />
                </span>
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white border border-neutral-200/80 px-4 py-3.5">
                  {[0, 150, 300].map((retraso) => (
                    <span
                      key={retraso}
                      className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                      style={{ animationDelay: `${retraso}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={fondo} />
          </div>

          {/* Pregunta */}
          <form onSubmit={enviar} className="shrink-0 border-t border-neutral-200/80 bg-white px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <input
                ref={entrada}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={MAX_LARGO}
                placeholder="Escribe tu pregunta…"
                aria-label="Tu pregunta"
                className="flex-1 min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
              />
              <button
                type="submit"
                disabled={pensando || texto.trim().length < 2}
                className="shrink-0 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 transition-colors"
                aria-label="Enviar pregunta"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-neutral-400">
              La IA puede equivocarse. No escribas datos de pacientes.
            </p>
          </form>
        </section>
      )}

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'}
        aria-expanded={abierto}
        title="Asistente virtual"
        className="fixed z-[700] bottom-5 right-4 sm:right-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-aqua-500 text-white flex items-center justify-center shadow-xl shadow-brand-900/25 hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
      >
        {!visto && <span className="absolute inset-0 rounded-2xl bg-brand-500 animate-pulse-ring" aria-hidden="true" />}
        {abierto ? <X className="relative w-6 h-6" /> : <Bot className="relative w-7 h-7" />}
      </button>
    </>
  );
}
