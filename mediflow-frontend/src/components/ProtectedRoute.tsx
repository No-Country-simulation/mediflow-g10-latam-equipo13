import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth, type Usuario } from '../lib/api';

interface ProtectedRouteProps {
  /** Si se indica, solo estos roles pueden entrar. */
  roles?: Usuario['rol'][];
}

// Solo en desarrollo: permite revisar las pantallas sin backend ni sesión.
const SALTAR_AUTH = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true';

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (SALTAR_AUTH) return <Outlet />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Verificando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && user && !roles.includes(user.rol)) {
    return (
      <div className="p-10 flex flex-col items-center text-center gap-3">
        <ShieldAlert className="w-12 h-12 text-warning-500" />
        <h2 className="text-lg font-bold text-neutral-900">Acceso restringido</h2>
        <p className="text-neutral-500 max-w-md">
          Tu rol ({user.rol}) no tiene permiso para ver esta sección. Pide a un administrador que te asigne el rol adecuado.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
