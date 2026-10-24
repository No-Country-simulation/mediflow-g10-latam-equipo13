import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { Button, Card } from '../components/ui';
import Logo from '../components/Logo';
import { useAuth } from '../lib/api';

/** Pantalla para cuentas con rol NO_ASIGNADO: no pueden usar la aplicación hasta que un administrador las apruebe. */
export default function PendienteAprobacionPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const salir = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <Card variant="elevated" padding="xl" className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-warning-50 text-warning-600 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-950">Tu cuenta está pendiente de aprobación</h1>
          <p className="text-neutral-500 mt-3">
            {user?.nombre ? `Hola, ${user.nombre}. ` : ''}Un administrador debe asignarte un rol antes de que puedas usar MediFlow.
            Cuando lo haga, cierra sesión y vuelve a iniciar sesión para que se actualice tu acceso.
          </p>
          <div className="flex justify-center mt-8">
            <Button onClick={salir} leftIcon={<LogOut className="w-4 h-4" />}>
              Cerrar sesión
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
