import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, AlertTriangle, Clock, ServerOff } from 'lucide-react';
import { Avatar, Badge, Button, Card, ConfirmDialog, Input, Select, SkeletonTable, useToastHelpers } from '../components/ui';
import { mensajeError, springApi, useAuth, type Usuario } from '../lib/api';

type Rol = Usuario['rol'];

const ROLES: { value: Rol; label: string; descripcion: string; variant: 'danger' | 'brand' | 'success' | 'warning' }[] = [
  { value: 'ADMIN', label: 'Administrador', descripcion: 'Todo, incluida la configuración y la gestión de usuarios', variant: 'danger' },
  { value: 'AUDITOR', label: 'Auditor', descripcion: 'Revisa y corrige los documentos con baja confianza', variant: 'brand' },
  { value: 'PERSONAL', label: 'Operario', descripcion: 'Procesa documentos y consulta colas e historial', variant: 'success' },
  { value: 'NO_ASIGNADO', label: 'Sin asignar', descripcion: 'Cuenta nueva pendiente de aprobación', variant: 'warning' },
];

const rolMeta = (rol: Rol) => ROLES.find((r) => r.value === rol) ?? ROLES[3];

interface ErrorCarga {
  mensaje: string;
  falta: boolean; // true = el backend todavía no tiene el endpoint
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToastHelpers();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ErrorCarga | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Rol | 'TODOS'>('TODOS');
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [porConfirmar, setPorConfirmar] = useState<{ usuario: Usuario; rol: Rol } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setUsuarios(await springApi.listarUsuarios());
    } catch (e) {
      const status = (e as { status?: number })?.status;
      setError({
        mensaje: mensajeError(e, 'No se pudieron cargar los usuarios'),
        falta: status === 404 || status === 405,
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const conteo = useMemo(() => {
    const c: Record<Rol, number> = { ADMIN: 0, AUDITOR: 0, PERSONAL: 0, NO_ASIGNADO: 0 };
    usuarios.forEach((u) => {
      c[u.rol] += 1;
    });
    return c;
  }, [usuarios]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios
      .filter((u) => filtro === 'TODOS' || u.rol === filtro)
      .filter((u) => !q || u.nombre.toLowerCase().includes(q))
      .sort((a, b) => {
        // Las cuentas pendientes primero.
        if ((a.rol === 'NO_ASIGNADO') !== (b.rol === 'NO_ASIGNADO')) return a.rol === 'NO_ASIGNADO' ? -1 : 1;
        return a.nombre.localeCompare(b.nombre, 'es');
      });
  }, [usuarios, busqueda, filtro]);

  const aplicarCambio = async (u: Usuario, rol: Rol) => {
    setGuardandoId(u.id);
    try {
      const resp = await springApi.cambiarRolUsuario(u.id, rol);
      void resp; // el servidor confirmó el cambio: se refleja solo el rol pedido
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol } : x)));
      success('Rol actualizado', `${u.nombre} ahora es ${rolMeta(rol).label}.`);
    } catch (e) {
      toastError('No se pudo cambiar el rol', mensajeError(e, 'Intenta de nuevo.'));
    } finally {
      setGuardandoId(null);
    }
  };

  const pedirCambio = (u: Usuario, rol: Rol) => {
    if (rol === u.rol) return;
    // Dar permisos de administrador pide confirmación.
    if (rol === 'ADMIN') setPorConfirmar({ usuario: u, rol });
    else aplicarCambio(u, rol);
  };

  const motivoBloqueo = (u: Usuario): string | null => {
    if (user && (u.id === user.id || u.nombre === user.nombre)) return 'No puedes cambiar tu propio rol';
    if (u.rol === 'ADMIN' && conteo.ADMIN <= 1) return 'Debe quedar al menos un administrador';
    return null;
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-neutral-600 text-[15px] max-w-2xl">Aprueba cuentas nuevas y define qué puede hacer cada persona.</p>
        </div>
        <div className="flex items-center gap-3">
          {conteo.NO_ASIGNADO > 0 && (
            <Badge variant="warning" dot size="md">
              {conteo.NO_ASIGNADO} pendiente{conteo.NO_ASIGNADO === 1 ? '' : 's'}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={cargar} loading={cargando} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* El backend aún no tiene el endpoint */}
      {error?.falta && (
        <Card variant="default" padding="lg" className="border-warning-200 bg-warning-50">
          <div className="flex items-start gap-3">
            <ServerOff className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
            <div className="text-sm text-warning-800 space-y-2">
              <p className="font-semibold">El servidor todavía no expone la gestión de usuarios.</p>
              <p>Esta pantalla ya está lista. Falta que el equipo de Spring agregue estos endpoints:</p>
              <ul className="list-disc pl-5 font-mono text-xs space-y-1">
                <li>GET /api/usuarios</li>
                <li>PATCH /api/usuarios/{'{id}'}/rol &nbsp;con &nbsp;{'{ "rol": "ADMIN | AUDITOR | PERSONAL | NO_ASIGNADO" }'}</li>
              </ul>
              <p>Los detalles están en CONTRATO_BACKEND.md.</p>
            </div>
          </div>
        </Card>
      )}

      {error && !error.falta && (
        <Card variant="default" className="border-danger-200 bg-danger-50">
          <div className="flex items-center gap-3 text-danger-700 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error.mensaje}
          </div>
        </Card>
      )}

      {!error && (
        <>
          {/* Resumen por rol (también filtra) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setFiltro(filtro === r.value ? 'TODOS' : r.value)}
                aria-pressed={filtro === r.value}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  filtro === r.value ? 'border-brand-500 bg-brand-50/40 shadow-sm' : 'border-neutral-100 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900">{r.label}</span>
                  <Badge variant={r.variant} size="xs">{conteo[r.value]}</Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-1.5">{r.descripcion}</p>
              </button>
            ))}
          </div>

          <div className="max-w-sm">
            <Input
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              aria-label="Buscar usuario"
            />
          </div>

          <Card variant="default" padding="none">
            {cargando ? (
              <SkeletonTable rows={5} columns={4} />
            ) : visibles.length === 0 ? (
              <div className="text-center py-14 text-sm text-neutral-500">
                {usuarios.length === 0 ? 'Todavía no hay usuarios registrados.' : 'Ningún usuario coincide con la búsqueda.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-neutral-400 border-b border-neutral-100">
                      <th className="px-5 py-3 font-medium">Usuario</th>
                      <th className="px-5 py-3 font-medium">Rol</th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                      <th className="px-5 py-3 font-medium">Alta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((u) => {
                      const bloqueo = motivoBloqueo(u);
                      return (
                        <tr key={u.id} className="border-t border-neutral-100 hover:bg-neutral-50/70">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.nombre} size="sm" />
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-900 truncate flex items-center gap-2">
                                  {u.nombre}
                                  {user && (u.id === user.id || u.nombre === user.nombre) && <Badge variant="neutral" size="xs">Tú</Badge>}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">ID {u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div title={bloqueo ?? undefined}>
                              <Select
                                aria-label={`Rol de ${u.nombre}`}
                                value={u.rol}
                                onChange={(e) => pedirCambio(u, e.target.value as Rol)}
                                disabled={guardandoId === u.id || bloqueo !== null}
                                options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                                className="py-1.5 text-sm min-w-[170px]"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {u.rol === 'NO_ASIGNADO' ? (
                              <Badge variant="warning" dot size="xs"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
                            ) : (
                              <Badge variant={u.activo ? 'success' : 'neutral'} dot size="xs">{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">
                            {(u.fechaCreacion ?? u.fechaRegistro) ? new Date((u.fechaCreacion ?? u.fechaRegistro) as string).toLocaleDateString('es-CO') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <ConfirmDialog
        isOpen={porConfirmar !== null}
        onClose={() => setPorConfirmar(null)}
        onConfirm={async () => {
          if (porConfirmar) await aplicarCambio(porConfirmar.usuario, porConfirmar.rol);
        }}
        title="Dar permisos de administrador"
        message={
          porConfirmar
            ? `${porConfirmar.usuario.nombre} podrá ver y cambiar la configuración de triaje y gestionar a todos los usuarios. ¿Confirmas?`
            : ''
        }
        confirmText="Sí, hacer administrador"
        variant="warning"
      />
    </div>
  );
}
