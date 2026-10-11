import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card, useToastHelpers } from '../components/ui';
import Logo from '../components/Logo';
import { useAuth, mensajeError } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error: toastError } = useToastHelpers();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const from = (location.state as { from?: string })?.from || '/inicio';

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email inválido';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await login({ email, password });
      success('Bienvenido', 'Has iniciado sesión correctamente');
      navigate(from, { replace: true });
    } catch (err) {
      const message = mensajeError(err, 'Credenciales inválidas');
      toastError('Error', message);
      if (message.includes('email')) setErrors({ email: message });
      else if (message.includes('password') || message.includes('contraseña')) setErrors({ password: message });
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
                label="Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                placeholder="tu@email.com"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email}
                autoComplete="email"
                disabled={loading}
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500/30 focus:ring-2"
                  />
                  <span className="text-sm text-neutral-600">Recordarme</span>
                </label>
                <Link to="/recuperar-password" className="text-sm text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
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

          {import.meta.env.DEV && (
            <div className="mt-6 text-center text-sm text-neutral-400">
              <p>Solo en desarrollo — credenciales de prueba:</p>
              <p className="font-mono text-neutral-500">admin@mediflow.com / admin123</p>
            </div>
          )}
        </div>
      </div>
  );
}