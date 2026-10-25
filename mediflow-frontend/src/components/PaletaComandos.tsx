/**
 * Paleta de comandos (Ctrl/⌘ + K): ir a cualquier pantalla, lanzar acciones o buscar documentos.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CornerDownLeft, FileText, Search, type LucideIcon } from 'lucide-react';
import { springApi, springToUnificado, type DocumentoUnificado } from '../lib/api';
import { cn } from '../lib/design-system';

export interface Comando {
  id: string;
  grupo: 'Ir a' | 'Acciones';
  titulo: string;
  detalle?: string;
  Icono: LucideIcon;
  ruta: string;
}

interface Item {
  id: string;
  grupo: string;
  titulo: string;
  detalle?: string;
  Icono: LucideIcon;
  ruta: string;
  estado?: { punto: string };
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function PaletaComandos({ abierta, onCerrar, comandos }: { abierta: boolean; onCerrar: () => void; comandos: Comando[] }) {
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState('');
  const [seleccion, setSeleccion] = useState(0);
  const [documentos, setDocumentos] = useState<DocumentoUnificado[] | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  // Al abrir: limpiar, enfocar y traer los documentos para buscarlos (una vez por apertura).
  useEffect(() => {
    if (!abierta) return;
    setConsulta('');
    setSeleccion(0);
    window.setTimeout(() => entrada.current?.focus(), 30);
    springApi
      .getDocumentos(0, 500)
      .then((p) => setDocumentos(p.content.map(springToUnificado)))
      .catch(() => setDocumentos([]));
  }, [abierta]);

  const items = useMemo<Item[]>(() => {
    const q = normalizar(consulta.trim());
    const coincide = (...textos: (string | undefined)[]) => !q || textos.some((t) => t && normalizar(t).includes(q));
    const base: Item[] = comandos.filter((c) => coincide(c.titulo, c.detalle)).map((c) => ({ ...c }));
    const docs: Item[] = q
      ? (documentos ?? [])
          .filter((d) => coincide(d.tipo, d.paciente.nombre, d.destino, d.documentoId, d.medico.nombre, d.diagnosticoPrincipal ?? undefined))
          .slice(0, 6)
          .map((d) => ({
            id: `doc-${d.id}`,
            grupo: 'Documentos',
            titulo: `${d.tipo}${d.paciente.nombre ? ` · ${d.paciente.nombre}` : ''}`,
            detalle: `${d.destino || 'Sin destino'} · ${Math.round(d.scoreConfianza * 100)}% · ${d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO') : ''}`,
            Icono: FileText,
            ruta: `/documentos/${d.id}`,
            estado: { punto: d.prioridad === 'Urgente' ? 'bg-danger-500' : d.requiereAuditoria ? 'bg-warning-500' : 'bg-success-500' },
          }))
      : [];
    return [...base, ...docs];
  }, [consulta, comandos, documentos]);

  useEffect(() => setSeleccion(0), [consulta]);

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${seleccion}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [seleccion]);

  if (!abierta) return null;

  const abrir = (item: Item | undefined) => {
    if (!item) return;
    onCerrar();
    navigate(item.ruta);
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSeleccion((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSeleccion((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      abrir(items[seleccion]);
    } else if (e.key === 'Escape') {
      onCerrar();
    }
  };

  const grupos = items.reduce<Record<string, { item: Item; indice: number }[]>>((acc, item, indice) => {
    (acc[item.grupo] ??= []).push({ item, indice });
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[900] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm modal-overlay-enter" onClick={onCerrar} aria-hidden="true" />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden modal-content-enter" onKeyDown={alTeclear}>
        <div className="flex items-center gap-3 px-5 border-b border-neutral-100">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={entrada}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Busca una pantalla, una acción o un paciente…"
            className="w-full py-4 text-[15px] bg-transparent outline-none placeholder:text-neutral-400"
            aria-label="Buscar"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md border border-neutral-200 text-[11px] font-mono text-neutral-400">Esc</kbd>
        </div>

        <div ref={lista} className="max-h-[52vh] overflow-y-auto p-2 scrollbar-thin">
          {items.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-neutral-500">
              {documentos === null && consulta ? 'Buscando…' : 'Sin resultados para esa búsqueda.'}
            </p>
          )}
          {Object.entries(grupos).map(([grupo, entradas]) => (
            <div key={grupo} className="mb-1">
              <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{grupo}</p>
              {entradas.map(({ item, indice }) => (
                <button
                  key={item.id}
                  type="button"
                  data-indice={indice}
                  onMouseMove={() => setSeleccion(indice)}
                  onClick={() => abrir(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                    indice === seleccion ? 'bg-gradient-to-r from-brand-50 to-aqua-50/60 text-ink-900' : 'text-neutral-700'
                  )}
                >
                  <span className={cn('relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0', indice === seleccion ? 'bg-white shadow-sm text-brand-600' : 'bg-neutral-100 text-neutral-500')}>
                    <item.Icono className="w-4 h-4" />
                    {!!item.estado && <span className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white', item.estado.punto)} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{item.titulo}</span>
                    {!!item.detalle && <span className="block text-xs text-neutral-500 truncate">{item.detalle}</span>}
                  </span>
                  {indice === seleccion ? <CornerDownLeft className="w-4 h-4 text-brand-500" /> : <ArrowRight className="w-4 h-4 text-neutral-300" />}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-neutral-100 bg-neutral-50/70 text-[11px] text-neutral-500">
          <span><kbd className="font-mono">↑ ↓</kbd> moverse</span>
          <span><kbd className="font-mono">Enter</kbd> abrir</span>
          <span className="ml-auto">MediFlow</span>
        </div>
      </div>
    </div>
  );
}
