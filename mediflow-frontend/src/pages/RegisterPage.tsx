import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ArrowRight, Check } from 'lucide-react';
import { Button, Input, useToastHelpers } from '../components/ui';
import LayoutAcceso from '../components/LayoutAcceso';
import { useAuth, mensajeError } from '../lib/api';
import { cn } from '../lib/design-system';

// El backend exige al menos 8 caracteres (UsuarioRegister.password).
const REQUISITOS_CLAVE = [
  { test: /.{8,}/, label: 'Mínimo 8 caracteres' },
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
      newErrors.password = 'Debe tener mínimo 8 caracteres, mayúscula, minúscula y número';
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
    <LayoutAcceso
      titulo="Crea tu cuenta"
      subtitulo="Un administrador te asignará tu rol (personal, auditor o administrador) después del registro."
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold underline-offset-2 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
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
                <div className="mt-3">
                  {/* Medidor de fortaleza: un tramo por requisito cumplido */}
                  <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                    {REQUISITOS_CLAVE.map((req, i) => (
                      <span
                        key={req.label}
                        className={cn(
                          'h-1.5 rounded-full transition-colors duration-300',
                          REQUISITOS_CLAVE.filter((r) => r.test.test(formData.password)).length > i ? 'bg-gradient-to-r from-brand-500 to-aqua-500' : 'bg-neutral-200'
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
                    {REQUISITOS_CLAVE.map((req) => {
                      const cumple = req.test.test(formData.password);
                      return (
                        <div key={req.label} className="flex items-center gap-1.5 text-xs">
                          <span className={cn('w-4 h-4 rounded-full flex items-center justify-center transition-colors', cumple ? 'bg-success-500 text-white' : 'bg-neutral-100 text-transparent')}>
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                          <span className={cn(cumple ? 'text-neutral-700' : 'text-neutral-400')}>{req.label}</span>
                        </div>
                      );
                    })}
                  </div>
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

            <Button type="submit" className="w-full" size="lg" loading={loading} rightIcon={<ArrowRight className="w-5 h-5" />}>
              Crear cuenta
            </Button>
          </form>
    </LayoutAcceso>
  );
}
