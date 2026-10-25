import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ArrowRight } from 'lucide-react';
import { Button, Input, useToastHelpers } from '../components/ui';
import LayoutAcceso from '../components/LayoutAcceso';
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
    <LayoutAcceso
      titulo="Bienvenido de nuevo"
      subtitulo="Inicia sesión para procesar, revisar y enrutar documentos clínicos."
      pie={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-brand-600 hover:text-brand-700 font-semibold underline-offset-2 hover:underline">
            Crea una
          </Link>
        </>
      }
    >
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

            <Button type="submit" className="w-full" size="lg" loading={loading} rightIcon={<ArrowRight className="w-5 h-5" />}>
              Iniciar sesión
            </Button>
          </form>
    </LayoutAcceso>
  );
}
