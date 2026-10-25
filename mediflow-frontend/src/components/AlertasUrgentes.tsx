/**
 * Alertas en tiempo real: consulta cada 20 s los casos urgentes y avisa de los nuevos.
 * La campana muestra cuántos no se han visto; al abrirla se marcan como vistos (en este navegador).
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Siren } from 'lucide-react';
import { useToastHelpers } from './ui';
import { springApi, useAuth, type AlertaUrgente } from '../lib/api';

const CLAVE_VISTAS = 'mediflow:alertas-vistas';
const INTERVALO_MS = 20_000;

function leerVistas(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_VISTAS) ?? '[]') as number[]);
  } catch {
    return new Set();
  }
}

function guardarVistas(ids: Set<number>) {
  try {
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([...ids].slice(-200)));
  } catch {
    // sin almacenamiento local: solo se pierde el recuerdo de lo visto
  }
}

export default function AlertasUrgentes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { warning } = useToastHelpers();
  const [alertas, setAlertas] = useState<AlertaUrgente[]>([]);
  const [vistas, setVistas] = useState<Set<number>>(leerVistas);
  const [abierto, setAbierto] = useState(false);
  const avisadas = useRef<Set<number> | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const habilitado = !!user && user.rol !== 'NO_ASIGNADO';

  useEffect(() => {
    if (!habilitado) return;
    let vivo = true;
    const consultar = async () => {
      try {
        const lista = await springApi.alertas();
        if (!vivo) return;
        setAlertas(lista);
        // En la primera consulta solo se registran: no se avisa de lo que ya existía al entrar.
        if (avisadas.current === null) {
          avisadas.current = new Set(lista.map((a) => a.id));
          return;
        }
        for (const a of lista) {
          if (!avisadas.current.has(a.id)) {
            avisadas.current.add(a.id);
            warning('🚨 Caso urgente', a.mensaje ?? `${a.tipo ?? 'Documento'} derivado a ${a.destino ?? 'emergencias'}`, { duration: 10000 });
          }
        }
      } catch {
        // Sin conexión: se reintenta en la próxima vuelta.
      }
    };
    consultar();
    const t = window.setInterval(consultar, INTERVALO_MS);
    return () => {
      vivo = false;
      window.clearInterval(t);
    };
  }, [habilitado, warning]);

  // Cierra el panel al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  if (!habilitado) return null;

  const sinVer = alertas.filter((a) => !vistas.has(a.id)).length;

  const alternar = () => {
    setAbierto((v) => !v);
    if (!abierto && sinVer > 0) {
      const nuevas = new Set([...vistas, ...alertas.map((a) => a.id)]);
      setVistas(nuevas);
      guardarVistas(nuevas);
    }
  };

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={alternar}
        className="relative p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        aria-label={sinVer ? `${sinVer} casos urgentes sin ver` : 'Casos urgentes'}
        aria-expanded={abierto}
      >
        <Bell className="w-5 h-5" />
        {sinVer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[11px] font-bold flex items-center justify-center animate-pulse">
            {sinVer > 9 ? '9+' : sinVer}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-neutral-200 z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
            <Siren className="w-4 h-4 text-danger-500" />
            <p className="font-semibold text-sm text-neutral-900">Casos urgentes (últimas 24 h)</p>
          </div>
          {alertas.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500 text-center">Sin casos urgentes recientes.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
              {alertas.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setAbierto(false);
                      navigate(`/documentos/${a.id}`);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-neutral-50"
                  >
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {a.tipo ?? 'Documento'}{a.paciente ? ` · ${a.paciente}` : ''}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {a.requiereAuditoria ? 'En revisión humana' : a.destino ?? 'Emergencias'}
                      {a.fecha ? ` · ${new Date(a.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
