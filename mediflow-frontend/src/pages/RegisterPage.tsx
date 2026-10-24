import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, CheckCircle2, UserPlus } from 'lucide-react';
import { Button, Input, Card, useToastHelpers } from '../components/ui';
import Logo from '../components/Logo';
import { useAuth, mensajeError } from '../lib/api';
import { cn } from '../lib/design-system';

const REQUISITOS_CLAVE = [
  { test: /.{6,}/, label: 'Mínimo 6 caracteres' },
  { test: /[a-z]/, label: 'Una minúscula' },
  { test: /[A-Z]/, label: 'Una mayúscula' },
  { test: /\d/, label: 'Un número' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: toastError } = useToastHelpers();

  const [formData, setFormData] = useState({ nombre: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validate = () => {
    const newErrors: Record<string, string | undefined> = {};
    const nombre = formData.nombre.trim();
    if (!nombre) newErrors.nombre = 'El nombre de usuario es obligatorio';
    else if (nombre.length < 3) newErrors.nombre = 'Mínimo 3 caracteres';
    else if (nombre.length > 50) newErrors.nombre = 'Máximo 50 caracteres';

    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    else if (!REQUISITOS_CLAVE.every((r) => r.test.test(formData.password))) {
      newErrors.password = 'Debe tener mínimo 6 caracteres, mayúscula, minúscula y número';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ nombre: formData.nombre.trim(), password: formData.password });
      success('Cuenta creada', 'Bienvenido a MediFlow');
      navigate('/inicio', { replace: true });
    } catch (err) {
      const message = mensajeError(err, 'Error al registrar');
      toastError('Error', message);
      const m = message.toLowerCase();
      if (m.includes('contraseña') || m.includes('password')) setErrors((prev) => ({ ...prev, password: message }));
      else if (m.includes('usuario') || m.includes('nombre') || m.includes('existe') || m.includes('registrad')) {
        setErrors((prev) => ({ ...prev, nombre: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in">
        <div className="flex justify-center mb-8"><Logo /></div>

        <Card variant="elevated" padding="xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-950">Crear cuenta</h1>
              <p className="text-neutral-500 text-sm">Un administrador te asignará tu rol después del registro.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nombre de usuario"
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej. juan.perez"
              hint="Es el que usarás para iniciar sesión."
              leftIcon={<User className="w-5 h-5" />}
              error={errors.nombre}
              autoComplete="username"
              disabled={loading}
            />

            <div>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
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
                autoComplete="new-password"
                disabled={loading}
              />
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {REQUISITOS_CLAVE.map((req) => {
                    const cumple = req.test.test(formData.password);
                    return (
                      <div key={req.label} className="flex items-center gap-1.5 text-xs">
                        <span className={cn('w-3.5 h-3.5 rounded-full border', cumple ? 'border-success-500 bg-success-500' : 'border-neutral-300')} />
                        <span className={cn(cumple ? 'text-success-600' : 'text-neutral-400')}>{req.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Input
              label="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              error={errors.confirmPassword}
              autoComplete="new-password"
              disabled={loading}
            />

            <Button type="submit" className="w-full" size="lg" loading={loading} leftIcon={<CheckCircle2 className="w-5 h-5" />}>
              Crear cuenta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium underline-offset-2 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
