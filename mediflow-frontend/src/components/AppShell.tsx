import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  UploadCloud,
  History,
  ListTree,
  ShieldCheck,
  Settings,
  Users,
  Menu,
  X,
  LogIn,
  Search,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import Logo from './Logo';
import AlertasUrgentes from './AlertasUrgentes';
import PaletaComandos, { type Comando } from './PaletaComandos';
import { UserMenu } from './ui';
import { cn } from '../lib/design-system';
import { useAuth, estadoDelAgente, type Usuario } from '../lib/api';

interface NavItem {
  to: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
  grupo: 'Operación' | 'Administración';
  roles?: Usuario['rol'][];
}

const navItems: NavItem[] = [
  { to: '/inicio', label: 'Inicio', descripcion: 'Resumen de la actividad del agente', icon: Home, grupo: 'Operación' },
  { to: '/procesar', label: 'Procesar documento', descripcion: 'Archivo, texto o casos de prueba', icon: UploadCloud, grupo: 'Operación' },
  { to: '/colas', label: 'Colas de enrutamiento', descripcion: 'Documentos por destino', icon: ListTree, grupo: 'Operación' },
  { to: '/auditoria', label: 'Auditoría humana', descripcion: 'Casos que decide una persona', icon: ShieldCheck, grupo: 'Operación', roles: ['ADMIN', 'AUDITOR'] },
  { to: '/historial', label: 'Historial', descripcion: 'Todo lo procesado, con filtros', icon: History, grupo: 'Operación' },
  { to: '/usuarios', label: 'Usuarios y roles', descripcion: 'Asignar permisos', icon: Users, grupo: 'Administración', roles: ['ADMIN'] },
  { to: '/configuracion', label: 'Reglas de triaje', descripcion: 'Umbral, urgencias y destinos', icon: Settings, grupo: 'Administración', roles: ['ADMIN'] },
];

type Estado = 'verificando' | 'ok' | 'caido';

function Indicador({ estado, label }: { estado: Estado; label: string }) {
  const color = estado === 'ok' ? 'bg-aqua-400' : estado === 'caido' ? 'bg-danger-500' : 'bg-white/30';
  const texto = estado === 'ok' ? 'en línea' : estado === 'caido' ? 'sin conexión' : 'verificando…';
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {estado === 'ok' && <span className={cn('absolute inline-flex h-full w-full rounded-full animate-pulse-ring', color)} />}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', color)} />
      </span>
      <span className="text-white/70">{label}</span>
      <span className="ml-auto text-white/40">{texto}</span>
    </div>
  );
}

export default function AppShell() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const [spring, setSpring] = useState<Estado>('verificando');
  const [fastapi, setFastapi] = useState<Estado>('verificando');

  // Al navegar: cierra el menú móvil y vuelve al inicio de la página.
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Estado real de los servicios. Un fallo aislado (p. ej. el motor ocupado con Gemini) no basta
  // para marcarlo caído: se reintenta a los 5 s y solo dos fallos seguidos lo ponen en rojo.
  useEffect(() => {
    let vivo = true;
    let t = 0;
    const fallos = { spring: 0, fastapi: 0 };
    const comprobar = async () => {
      const r = await estadoDelAgente();
      if (!vivo) return;
      fallos.spring = r.spring ? 0 : fallos.spring + 1;
      fallos.fastapi = r.fastapi ? 0 : fallos.fastapi + 1;
      if (r.spring) setSpring('ok');
      else if (fallos.spring >= 2) setSpring('caido');
      if (r.fastapi) setFastapi('ok');
      else if (fallos.fastapi >= 2) setFastapi('caido');
      t = window.setTimeout(comprobar, r.spring && r.fastapi ? 30000 : 5000);
    };
    comprobar();
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, []);

  // Ctrl/⌘ + K abre la paleta de comandos.
  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaleta((v) => !v);
      }
    };
    window.addEventListener('keydown', atajo);
    return () => window.removeEventListener('keydown', atajo);
  }, []);

  const visibles = navItems.filter((i) => !i.roles || !user || i.roles.includes(user.rol));
  const actual: Pick<NavItem, 'label' | 'descripcion'> | undefined = location.pathname.startsWith('/documentos/')
    ? { label: 'Detalle del documento', descripcion: 'Decisión del agente, datos extraídos y trazabilidad' }
    : visibles.find((i) => location.pathname.startsWith(i.to));
  const esMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

  const comandos = useMemo<Comando[]>(
    () => [
      ...visibles.map((i) => ({ id: i.to, grupo: 'Ir a' as const, titulo: i.label, detalle: i.descripcion, Icono: i.icon, ruta: i.to })),
      { id: 'demo', grupo: 'Acciones', titulo: 'Probar los 3 escenarios', detalle: 'Rutina, urgencia y ambiguo', Icono: FlaskConical, ruta: '/procesar' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.rol]
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-brand-500/25 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 -right-24 w-64 h-64 rounded-full bg-aqua-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative h-16 flex items-center justify-between px-5 shrink-0">
        <Logo tono="oscuro" subtitle="Triaje clínico autónomo" />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="relative flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin-dark" aria-label="Navegación principal">
        {(['Operación', 'Administración'] as const).map((grupo) => {
          const items = visibles.filter((i) => i.grupo === grupo);
          if (!items.length) return null;
          return (
            <div key={grupo}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">{grupo}</p>
              <div className="space-y-1">
                {items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400/40',
                        isActive ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-white/55 hover:text-white hover:bg-white/[0.05]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-brand-400 to-aqua-400" aria-hidden="true" />}
                        <Icon className={cn('w-[18px] h-[18px] flex-shrink-0 transition-colors', isActive ? 'text-aqua-300' : 'text-white/45 group-hover:text-white/80')} aria-hidden="true" />
                        <span className="truncate">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="relative m-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-[12px] shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">Estado del agente</p>
        <Indicador estado={fastapi} label="Motor de IA" />
        <Indicador estado={spring} label="API principal" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Barra lateral escritorio */}
      <aside className="hidden lg:block w-[264px] shrink-0 bg-ink-900 sticky top-0 h-screen">{sidebar}</aside>

      {/* Barra lateral móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-[264px] bg-ink-900 shadow-2xl animate-in">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/75 backdrop-blur-xl border-b border-neutral-200/70">
          <div className="flex items-center justify-between gap-4 h-16 px-4 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-[17px] font-semibold text-ink-900 truncate">{actual?.label ?? 'MediFlow'}</h1>
                {!!actual && <p className="hidden sm:block text-xs text-neutral-500 -mt-0.5 truncate">{actual.descripcion}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setPaleta(true)}
                  className="hidden md:flex items-center gap-2.5 w-64 pl-3 pr-2 py-2 rounded-xl border border-neutral-200 bg-neutral-50/80 text-sm text-neutral-400 hover:border-neutral-300 hover:bg-white transition-colors"
                  aria-label="Abrir paleta de comandos"
                >
                  <Search className="w-4 h-4" />
                  Buscar o ir a…
                  <kbd className="ml-auto px-1.5 py-0.5 rounded-md bg-white border border-neutral-200 text-[11px] font-mono text-neutral-500">{esMac ? '⌘' : 'Ctrl'} K</kbd>
                </button>
              )}
              {isAuthenticated && user ? (
                <>
                  <button type="button" onClick={() => setPaleta(true)} className="md:hidden p-2 rounded-xl text-neutral-500 hover:bg-neutral-100" aria-label="Buscar">
                    <Search className="w-5 h-5" />
                  </button>
                  <AlertasUrgentes />
                  <UserMenu
                    user={{ name: user.nombre, role: user.rol }}
                    onSettingsClick={user.rol === 'ADMIN' ? () => navigate('/configuracion') : undefined}
                    onLogoutClick={handleLogout}
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-brand-600 hover:bg-brand-50"
                >
                  <LogIn className="w-4 h-4" /> Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="relative flex-1 min-w-0">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-50/70 via-aqua-50/20 to-transparent" aria-hidden="true" />
          <div className="relative">
            <Outlet />
          </div>
        </main>
      </div>

      <PaletaComandos abierta={paleta} onCerrar={() => setPaleta(false)} comandos={comandos} />
    </div>
  );
}
