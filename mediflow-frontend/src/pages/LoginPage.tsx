import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card, useToastHelpers } from '../components/ui';
import Logo from '../components/Logo';
import { useAuth, mensajeError } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error: toastError } = useToastHelpers();

  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string; password?: string }>({});

  const from = (location.state as { from?: string })?.from || '/inicio';

  const validate = () => {
    const newErrors: { nombre?: string; password?: string } = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre de usuario es obligatorio';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ nombre: nombre.trim(), password });
      success('Bienvenido', 'Has iniciado sesión correctamente');
      navigate(from, { replace: true });
    } catch (err) {
      const message = mensajeError(err, 'Usuario o contraseña incorrectos');
      toastError('Error', message);
      const m = message.toLowerCase();
      if (m.includes('contraseña') || m.includes('password')) setErrors({ password: message });
      else if (m.includes('usuario') || m.includes('nombre')) setErrors({ nombre: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in">
        <div className="flex justify-center mb-8"><Logo /></div>

        <Card variant="elevated" padding="xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-neutral-950">Iniciar sesión</h1>
            <p className="text-neutral-500 mt-2">Accede a tu cuenta de MediFlow</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nombre de usuario"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors({ ...errors, nombre: undefined });
              }}
              placeholder="Tu nombre de usuario"
              leftIcon={<User className="w-5 h-5" />}
              error={errors.nombre}
              autoComplete="username"
              disabled={loading}
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password}
              autoComplete="current-password"
              disabled={loading}
            />

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500/30 focus:ring-2"
                />
                <span className="text-sm text-neutral-600">Recordarme</span>
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading} leftIcon={<CheckCircle2 className="w-5 h-5" />}>
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-500">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-brand-600 hover:text-brand-700 font-medium underline-offset-2 hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}