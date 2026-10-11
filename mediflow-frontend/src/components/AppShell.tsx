import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  UploadCloud,
  History,
  ListTree,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogIn,
  type LucideIcon,
} from 'lucide-react';
import Logo from './Logo';
import { UserMenu } from './ui';
import { cn } from '../lib/design-system';
import { useAuth, verificarServicios, type Usuario } from '../lib/api';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Usuario['rol'][];
}

const navItems: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/procesar', label: 'Procesar documento', icon: UploadCloud },
  { to: '/auditoria', label: 'Auditoría humana', icon: ShieldCheck, roles: ['ADMIN', 'AUDITOR'] },
  { to: '/colas', label: 'Colas de enrutamiento', icon: ListTree },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
];

type Estado = 'verificando' | 'ok' | 'caido';

function Indicador({ estado, label }: { estado: Estado; label: string }) {
  const color = estado === 'ok' ? 'bg-success-500' : estado === 'caido' ? 'bg-danger-500' : 'bg-neutral-300 animate-pulse';
  const texto = estado === 'ok' ? 'en línea' : estado === 'caido' ? 'sin conexión' : 'verificando…';
  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-1.5 h-1.5 rounded-full', color)} aria-hidden="true" />
      {label}: {texto}
    </div>
  );
}

export default function AppShell() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spring, setSpring] = useState<Estado>('verificando');
  const [fastapi, setFastapi] = useState<Estado>('verificando');

  // Cierra el menú móvil al navegar.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Estado real de los servicios (reemplaza los textos fijos de antes).
  useEffect(() => {
    let vivo = true;
    const comprobar = async () => {
      const r = await verificarServicios();
      if (!vivo) return;
      setSpring(r.spring ? 'ok' : 'caido');
      setFastapi(r.fastapi ? 'ok' : 'caido');
    };
    comprobar();
    const t = window.setInterval(comprobar, 30000);
    return () => {
      vivo = false;
      window.clearInterval(t);
    };
  }, []);

  const visibles = navItems.filter((i) => !i.roles || !user || i.roles.includes(user.rol));
  const actual = visibles.find((i) => location.pathname.startsWith(i.to));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <>
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100 shrink-0">
        <Logo subtitle="Hackathon ONE G10" />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navegación principal">
        {visibles.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30',
                isActive ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              )
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-neutral-100 space-y-1.5 text-[12px] text-neutral-500 shrink-0">
        <Indicador estado={fastapi} label="Motor IA" />
        <Indicador estado={spring} label="API principal" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-neutral-200 flex-col sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white flex flex-col shadow-xl animate-in">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-neutral-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold text-neutral-900">{actual?.label ?? 'MediFlow'}</h1>
            </div>

            {isAuthenticated && user ? (
              <UserMenu
                user={{ name: user.nombre, email: user.email, role: user.rol }}
                onSettingsClick={user.rol === 'ADMIN' ? () => navigate('/configuracion') : undefined}
                onLogoutClick={handleLogout}
              />
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
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
