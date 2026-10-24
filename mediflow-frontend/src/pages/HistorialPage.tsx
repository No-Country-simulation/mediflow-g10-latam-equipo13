import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Search,
  Download,
  Filter,
  ChevronDown,
  Calendar,
  Eye,
  FileText,
  X,
} from 'lucide-react';
import { Card, Badge, Button, Dropdown, Skeleton, Progress, Input } from '../components/ui';
import { cn } from '../lib/design-system';
import { springApi, fastApi, fastapiToUnificado, springToUnificado, type DocumentoUnificado } from '../lib/api';
import { exportarHistorialCsv } from '../lib/exportar';

const etiquetaStatus: Record<string, string> = {
  procesado: 'Procesado',
  en_revision: 'En revisión',
  error: 'Error',
  pendiente: 'Pendiente',
};

const statusColors = {
  procesado: 'success',
  en_revision: 'warning',
  error: 'danger',
  pendiente: 'info',
} as const;

const priorityColors = {
  Urgente: 'danger',
  Rutina: 'success',
} as const;

export default function HistorialPage() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoUnificado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEspecialidad, setFilterEspecialidad] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<'all' | 'Urgente' | 'Rutina'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'procesado' | 'en_revision' | 'error'>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [showFilters, setShowFilters] = useState(false);

  const cargarDatos = async () => {
    try {
      setError(null);
      const springResponse = await springApi.getDocumentos(0, 500);
      const springDocs = springResponse.content.map(springToUnificado);
      const allDocs = [...springDocs];
      allDocs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setDocumentos(allDocs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar historial');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Opciones únicas para filtros
  const tiposUnicos = useMemo(() => [...new Set(documentos.map(d => d.tipo))].sort(), [documentos]);
  const especialidadesUnicas = useMemo(() => [...new Set(documentos.map(d => d.especialidad))].sort(), [documentos]);

  // Filtrado
  const filtrados = useMemo(() => {
    return documentos.filter((doc) => {
      const matchesSearch = !busqueda ||
        doc.documentoId.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.especialidad.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.paciente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.destino.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.medico.nombre.toLowerCase().includes(busqueda.toLowerCase());

      const matchesTipo = filterTipo === 'all' || doc.tipo === filterTipo;
      const matchesEspecialidad = filterEspecialidad === 'all' || doc.especialidad === filterEspecialidad;
      const matchesPrioridad = filterPrioridad === 'all' || doc.prioridad === filterPrioridad;
      const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;

      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const docDate = new Date(doc.fecha);
        if (dateRange.from && docDate < dateRange.from) matchesDate = false;
        if (dateRange.to && docDate > dateRange.to) matchesDate = false;
      }

      return matchesSearch && matchesTipo && matchesEspecialidad && matchesPrioridad && matchesStatus && matchesDate;
    });
  }, [documentos, busqueda, filterTipo, filterEspecialidad, filterPrioridad, filterStatus, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const total = filtrados.length;
    const procesados = filtrados.filter(d => d.status === 'procesado').length;
    const enRevision = filtrados.filter(d => d.status === 'en_revision').length;
    const errores = filtrados.filter(d => d.status === 'error').length;
    const avgConfidence = filtrados.length > 0
      ? filtrados.reduce((sum, d) => sum + d.scoreConfianza, 0) / filtrados.length
      : 0;
    return { total, procesados, enRevision, errores, avgConfidence };
  }, [filtrados]);

  if (cargando) {
    return (
      <div className="p-6 space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Card variant="default" padding="lg" className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4" />
          <div className="h-8 bg-neutral-200 rounded w-1/2" />
        </Card>
        <div className="overflow-x-auto">
          <table className="w-full datatable">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Tipo</th>
                <th className="px-5 py-3 text-left">Prioridad</th>
                <th className="px-5 py-3 text-left">Confianza</th>
                <th className="px-5 py-3 text-left">Paciente</th>
                <th className="px-5 py-3 text-left">Médico</th>
                <th className="px-5 py-3 text-left">Especialidad</th>
                <th className="px-5 py-3 text-left">Destino</th>
                <th className="px-5 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="border-t border-neutral-100">
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-24" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-32" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-28" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-20" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-24" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-36" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-32" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-36" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-32" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-neutral-200 rounded w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const activeFilters = [
    filterTipo !== 'all',
    filterEspecialidad !== 'all',
    filterPrioridad !== 'all',
    filterStatus !== 'all',
    dateRange.from || dateRange.to,
  ].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-950">Historial de Documentos</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Todos los documentos procesados por el agente con filtros avanzados</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => exportarHistorialCsv(filtrados)}
            disabled={filtrados.length === 0}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Documentos</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card variant="default" padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Procesados OK</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1 text-success-600">{stats.procesados}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card variant="default" padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">En Revisión</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1 text-warning-600">{stats.enRevision}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card variant="default" padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Confianza Promedio</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1">{Math.round(stats.avgConfidence * 100)}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info-50 text-info-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por ID, tipo, paciente, médico, destino, CIE-10..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="w-4 h-4" />} className="gap-2">
            Filtros {activeFilters > 0 && <Badge variant="brand" size="xs">{activeFilters}</Badge>}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-neutral-100 animate-in">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Tipo</label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
              >
                <option value="all">Todos los tipos</option>
                {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Especialidad</label>
              <select
                value={filterEspecialidad}
                onChange={(e) => setFilterEspecialidad(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
              >
                <option value="all">Todas</option>
                {especialidadesUnicas.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Prioridad</label>
              <select
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value as 'all' | 'Urgente' | 'Rutina')}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
              >
                <option value="all">Todas</option>
                <option value="Urgente">Urgente</option>
                <option value="Rutina">Rutina</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'procesado' | 'en_revision' | 'error')}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
              >
                <option value="all">Todos</option>
                <option value="procesado">Procesado</option>
                <option value="en_revision">En Revisión</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Rango de Fechas</label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateRange.from?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : null })}
                  placeholder="Desde"
                  className="flex-1"
                />
                <span className="text-neutral-400">—</span>
                <Input
                  type="date"
                  value={dateRange.to?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : null })}
                  placeholder="Hasta"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Results Table */}
      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full datatable">
            <thead>
              <tr>
                <th className="w-32">ID</th>
                <th className="w-40">Fecha</th>
                <th>Tipo</th>
                <th className="w-28">Prioridad</th>
                <th className="w-28">Confianza</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Especialidad</th>
                <th>Destino</th>
                <th className="w-28">Estado</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-neutral-400">
                      <FileText className="w-12 h-12" />
                      <p className="text-neutral-500">
                        {documentos.length === 0
                          ? 'Aún no has procesado ningún documento.'
                          : 'Ningún documento coincide con la búsqueda y filtros.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtrados.map((doc) => (
                <tr
                  key={doc.documentoId}
                  onClick={() => navigate(`/documentos/${doc.documentoId}`, { state: { documento: doc } })}
                  className="table-row-hover cursor-pointer"
                >
                  <td className="font-mono text-sm text-neutral-900">{doc.documentoId.slice(0, 12)}…</td>
                  <td className="text-sm text-neutral-500 whitespace-nowrap">
                    {new Date(doc.fecha).toLocaleDateString('es-ES', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td><Badge variant="brand" size="sm">{doc.tipo}</Badge></td>
                  <td><Badge variant={priorityColors[doc.prioridad]} dot size="sm">{doc.prioridad}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={doc.scoreConfianza * 100} size="sm" className="w-20" variant={doc.scoreConfianza >= 0.8 ? 'success' : doc.scoreConfianza >= 0.6 ? 'warning' : 'danger'} />
                      <span className="text-xs font-semibold tabular-nums">{Math.round(doc.scoreConfianza * 100)}%</span>
                    </div>
                  </td>
                  <td className="font-medium text-neutral-900 truncate max-w-[150px]">{doc.paciente.nombre}</td>
                  <td className="text-neutral-600 truncate max-w-[120px]">{doc.medico.nombre}</td>
                  <td className="text-neutral-600">{doc.especialidad}</td>
                  <td className="text-sm text-neutral-600 truncate max-w-[140px]">{doc.destino || '—'}</td>
                  <td><Badge variant={statusColors[doc.status as keyof typeof statusColors] || 'neutral'} dot size="sm">{etiquetaStatus[doc.status] ?? doc.status}</Badge></td>
                  <td>
                    <Button variant="ghost" size="xs" className="p-1" onClick={(e) => { e.stopPropagation(); navigate(`/documentos/${doc.documentoId}`, { state: { documento: doc } }); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtrados.length > 0 && (
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
            <span>Mostrando {filtrados.length} de {documentos.length} documentos</span>
            <Button variant="ghost" size="sm" onClick={() => { setBusqueda(''); setFilterTipo('all'); setFilterEspecialidad('all'); setFilterPrioridad('all'); setFilterStatus('all'); setDateRange({ from: null, to: null }); }}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}