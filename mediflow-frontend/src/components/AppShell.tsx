import { NavLink, Outlet } from "react-router-dom";
import { Home, UploadCloud, History, ListTree, Settings } from "lucide-react";
import Logo from "./Logo";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/procesar", label: "Procesar documento", icon: UploadCloud },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/colas", label: "Colas de enrutamiento", icon: ListTree },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export default function AppShell() {
  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-brand-500 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-100 space-y-2 text-[12px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ok" />
            Sistema operativo · Gemini 3.6 Flash
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            OCI Object Storage · Always Free
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
