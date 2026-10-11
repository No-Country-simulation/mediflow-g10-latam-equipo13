import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Filter,
  Search,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, Badge, Button, Dropdown, Skeleton, SkeletonCard, SkeletonTable, Progress, Tabs } from '../components/ui';
import { cn } from '../lib/design-system';
import { springApi, fastApi, fastapiToUnificado, springToUnificado, type DocumentoUnificado } from '../lib/api';

const priorityColors = {
  Urgente: 'danger',
  Rutina: 'success',
} as const;

const statusColors = {
  procesado: 'success',
  en_revision: 'warning',
  error: 'danger',
  pendiente: 'info',
} as const;

export default function QueuePage() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoUnificado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'Urgente' | 'Rutina'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'procesado' | 'en_revision' | 'error'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const cargarDatos = async () => {
    try {
      setError(null);
      const springResponse = await springApi.getDocumentos(0, 100);
      const springDocs = springResponse.content.map(springToUnificado);
      const allDocs = [...springDocs];
      allDocs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setDocumentos(allDocs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  // Agrupar por cola de destino
  const colas = useMemo(() => {
    const grupos = new Map<string, DocumentoUnificado[]>();
    
    documentos.forEach(doc => {
      const destino = doc.destino || 'Sin destino';
      if (!grupos.has(destino)) {
        grupos.set(destino, []);
      }
      grupos.get(destino)!.push(doc);
    });

    return Array.from(grupos.entries()).map(([nombre, docs]) => ({
      nombre,
      documentos: docs,
      total: docs.length,
      urgentes: docs.filter(d => d.prioridad === 'Urgente').length,
      enRevision: docs.filter(d => d.status === 'en_revision').length,
      procesados: docs.filter(d => d.status === 'procesado').length,
    }));
  }, [documentos]);

  // Documentos filtrados
  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.documentoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.destino.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filterPriority === 'all' || doc.prioridad === filterPriority;
      const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
      
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [documentos, searchTerm, filterPriority, filterStatus]);

  if (cargando) {
    return (
      <div className="p-6 space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <SkeletonCard />
        <SkeletonTable rows={5} columns={7} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-950">Colas de Enrutamiento</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Estado actual de la distribución de documentos por cola de destino</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={handleRefresh} loading={refreshing}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats de colas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {colas.length === 0 ? (
          <Card variant="default" padding="lg" className="col-span-full text-center">
            <ShieldCheck className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No hay documentos en ninguna cola</p>
            <Button className="mt-4" variant="primary">Procesar primer documento</Button>
          </Card>
        ) : (
          colas.map((cola) => (
            <Card key={cola.nombre} variant="interactive" padding="lg" onClick={() => setSearchTerm(cola.nombre)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 truncate pr-4">{cola.nombre}</p>
                  <p className="text-3xl font-extrabold text-neutral-950 mt-1 tabular-nums">{cola.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-400">Procesados</p>
                  <p className="font-semibold text-success-600">{cola.procesados}</p>
                </div>
                <div className="p-2 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-400">En Revisión</p>
                  <p className="font-semibold text-warning-600">{cola.enRevision}</p>
                </div>
                <div className="p-2 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-400">Urgentes</p>
                  <p className="font-semibold text-danger-600">{cola.urgentes}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Filtros y búsqueda */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, tipo, paciente, destino..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Dropdown
              trigger={
                <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} className="gap-2">
                  Prioridad: {filterPriority === 'all' ? 'Todas' : filterPriority}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              }
              items={[
                { label: 'Todas', onClick: () => setFilterPriority('all') },
                { label: 'Urgente', onClick: () => setFilterPriority('Urgente') },
                { label: 'Rutina', onClick: () => setFilterPriority('Rutina') },
              ]}
            />
            <Dropdown
              trigger={
                <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} className="gap-2">
                  Estado: {filterStatus === 'all' ? 'Todos' : filterStatus.replace('_', ' ')}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              }
              items={[
                { label: 'Todos', onClick: () => setFilterStatus('all') },
                { label: 'Procesado', onClick: () => setFilterStatus('procesado') },
                { label: 'En Revisión', onClick: () => setFilterStatus('en_revision') },
                { label: 'Error', onClick: () => setFilterStatus('error') },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Vista de colas / tabla */}
      <Tabs
        tabs={[
          { id: 'tabla', label: 'Vista Tabla', content: (
            <div className="overflow-x-auto">
              <table className="w-full datatable">
                <thead>
                  <tr>
                    <th className="w-32">ID Documento</th>
                    <th>Tipo</th>
                    <th>Especialidad</th>
                    <th className="w-28">Prioridad</th>
                    <th className="w-28">Estado</th>
                    <th className="w-36">Confianza</th>
                    <th className="w-40">Destino</th>
                    <th className="w-28">Auditoría</th>
                    <th className="w-32">Fecha</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {documentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-8 text-center text-neutral-400">
                        {documentos.length === 0 ? 'Aún no hay documentos procesados' : 'Ningún documento coincide con los filtros'}
                      </td>
                    </tr>
                  ) : (
                    documentosFiltrados.map((doc) => (
                      <tr
                        key={doc.documentoId}
                        className="table-row-hover"
                        onClick={() => navigate(`/documentos/${doc.documentoId}`, { state: { documento: doc } })}
                      >
                        <td className="font-mono text-sm text-neutral-900">{doc.documentoId.slice(0, 12)}…</td>
                        <td><Badge variant="brand" size="sm">{doc.tipo}</Badge></td>
                        <td className="text-neutral-600">{doc.especialidad}</td>
                        <td><Badge variant={priorityColors[doc.prioridad]} dot size="sm">{doc.prioridad}</Badge></td>
                        <td><Badge variant={statusColors[doc.status as keyof typeof statusColors] || 'neutral'} dot size="sm">{doc.status.replace('_', ' ')}</Badge></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Progress value={doc.scoreConfianza * 100} size="sm" className="w-24" variant={doc.scoreConfianza >= 0.8 ? 'success' : doc.scoreConfianza >= 0.6 ? 'warning' : 'danger'} />
                            <span className="text-xs font-semibold tabular-nums">{Math.round(doc.scoreConfianza * 100)}%</span>
                          </div>
                        </td>
                        <td className="text-sm text-neutral-600 truncate max-w-[140px]">{doc.destino || '—'}</td>
                        <td className="text-center">
                          {doc.requiereAuditoria ? (
                            <Badge variant="warning" dot size="xs">Sí</Badge>
                          ) : (
                            <Badge variant="success" dot size="xs">No</Badge>
                          )}
                        </td>
                        <td className="text-sm text-neutral-500 whitespace-nowrap">{new Date(doc.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <Button variant="ghost" size="xs" className="p-1" onClick={(e) => { e.stopPropagation(); navigate(`/documentos/${doc.documentoId}`, { state: { documento: doc } }); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )},
          { id: 'kanban', label: 'Vista Kanban', content: (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {colas.map((cola) => (
                <Card key={cola.nombre} variant="default" padding="none" className="h-full flex flex-col">
                  <div className="p-4 border-b border-neutral-100 bg-neutral-50 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-neutral-900 truncate pr-2">{cola.nombre}</h3>
                      <Badge variant="brand" size="sm">{cola.total}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success-500" /> {cola.procesados}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-warning-500" /> {cola.enRevision}</span>
                      <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-danger-500" /> {cola.urgentes}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-96">
                    {cola.documentos.map((doc) => (
                      <div
                        key={doc.documentoId}
                        className="p-3 bg-white border border-neutral-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/documentos/${doc.documentoId}`, { state: { documento: doc } })}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 text-sm truncate">{doc.documentoId}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <Badge variant="brand" size="xs">{doc.tipo}</Badge>
                              <Badge variant={priorityColors[doc.prioridad]} dot size="xs">{doc.prioridad}</Badge>
                              <Badge variant={statusColors[doc.status as keyof typeof statusColors] || 'neutral'} dot size="xs">{doc.status.replace('_', ' ')}</Badge>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 truncate">{doc.paciente.nombre}</p>
                          </div>
                        </div>
                        <Progress value={doc.scoreConfianza * 100} size="xs" className="mt-2" variant={doc.scoreConfianza >= 0.8 ? 'success' : doc.scoreConfianza >= 0.6 ? 'warning' : 'danger'} />
                      </div>
                    ))}
                    {cola.documentos.length === 0 && (
                      <div className="text-center py-8 text-neutral-400 text-sm">Cola vacía</div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )},
        ]}
      />

      {/* Footer info */}
      <Card variant="default" padding="md" className="bg-success-50 border-success-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-success-800 text-sm">El agente autónomo está operando correctamente</p>
            <p className="text-success-700 text-xs mt-0.5">En caso de ambigüedad o score de confianza &lt; 0.60, el documento se envía a revisión humana automáticamente.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}