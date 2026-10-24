import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Brain,
  Users,
  Activity,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Download,
  UploadCloud,
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, StatCard, Badge, Button, Dropdown,
  Skeleton, SkeletonCard, SkeletonStatCard, SkeletonTable, Progress,
} from '../components/ui';
import { cn } from '../lib/design-system';
import { springApi, fastApi, fastapiToUnificado, springToUnificado, type DocumentoUnificado } from '../lib/api';
import { exportarHistorialJson } from '../lib/exportar';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoUnificado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const cargarDatos = async () => {
    try {
      setError(null);
      // Cargar desde Spring Boot (persistencia)
      const springResponse = await springApi.getDocumentos(0, 100);
      const springDocs = springResponse.content.map(springToUnificado);
      
      // También intentar cargar de FastAPI si está disponible
      let fastapiDocs: DocumentoUnificado[] = [];
      try {
        const fastapiList = await fastApi.healthCheck();
        // FastAPI no tiene endpoint de listado, pero podríamos simular
      } catch {
        // FastAPI no disponible, usar solo Spring
      }

      const allDocs = [...springDocs, ...fastapiDocs];
      // Ordenar por fecha descendente
      allDocs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setDocumentos(allDocs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
      console.error('Error loading dashboard:', e);
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

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = documentos.length;
    const procesados = documentos.filter(d => d.status === 'procesado').length;
    const enRevision = documentos.filter(d => d.status === 'en_revision').length;
    const errores = documentos.filter(d => d.status === 'error').length;
    const urgentes = documentos.filter(d => d.prioridad === 'Urgente').length;
    const avgConfidence = documentos.length > 0
      ? documentos.reduce((sum, d) => sum + d.scoreConfianza, 0) / documentos.length
      : 0;
    const autoRouted = documentos.filter(d => !d.requiereAuditoria).length;
    const auditRate = total > 0 ? ((total - autoRouted) / total) * 100 : 0;

    return { total, procesados, enRevision, errores, urgentes, avgConfidence, autoRouted, auditRate };
  }, [documentos]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    // Agrupar por día
    const byDay = new Map<string, { total: number; procesados: number; revision: number; urgentes: number }>();
    
    documentos.forEach(doc => {
      const day = new Date(doc.fecha).toISOString().split('T')[0];
      const existing = byDay.get(day) || { total: 0, procesados: 0, revision: 0, urgentes: 0 };
      existing.total++;
      if (doc.status === 'procesado') existing.procesados++;
      if (doc.status === 'en_revision') existing.revision++;
      if (doc.prioridad === 'Urgente') existing.urgentes++;
      byDay.set(day, existing);
    });

    // Últimos 7 días
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return days.map(day => {
      const data = byDay.get(day) || { total: 0, procesados: 0, revision: 0, urgentes: 0 };
      return {
        day: new Date(day).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
        ...data,
      };
    });
  }, [documentos]);

  // Distribución por especialidad
  const specialtyData = useMemo(() => {
    const map = new Map<string, number>();
    documentos.forEach(d => {
      map.set(d.especialidad, (map.get(d.especialidad) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [documentos]);

  // Distribución por tipo de documento
  const typeData = useMemo(() => {
    const map = new Map<string, number>();
    documentos.forEach(d => {
      map.set(d.tipo, (map.get(d.tipo) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [documentos]);

  if (cargando) {
    return (
      <div className="p-6 space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <SkeletonCard className="lg:col-span-2" />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-950">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Resumen en tiempo real del procesamiento de documentos</p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            trigger={
              <Button variant="outline" size="sm" leftIcon={<ChevronDown className="w-4 h-4" />}>
                {timeRange === '24h' ? 'Últimas 24h' : timeRange === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'}
              </Button>
            }
            items={[
              { label: 'Últimas 24h', onClick: () => setTimeRange('24h') },
              { label: 'Últimos 7 días', onClick: () => setTimeRange('7d') },
              { label: 'Últimos 30 días', onClick: () => setTimeRange('30d') },
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => exportarHistorialJson(documentos)}
            disabled={documentos.length === 0}
          >
            Exportar JSON
          </Button>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={handleRefresh} loading={refreshing}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documentos"
          value={metrics.total}
          icon={<FileCheck2 className="w-5 h-5" />}
          trend={{ value: 12, positive: true, label: 'vs semana anterior' }}
          variant="primary"
        />
        <StatCard
          title="Procesados OK"
          value={metrics.procesados}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ value: 8, positive: true, label: 'vs semana anterior' }}
          variant="success"
        />
        <StatCard
          title="En Revisión"
          value={metrics.enRevision}
          icon={<ShieldAlert className="w-5 h-5" />}
          trend={{ value: 5, positive: false, label: 'vs semana anterior' }}
          variant="warning"
        />
        <StatCard
          title="Urgentes"
          value={metrics.urgentes}
          icon={<Activity className="w-5 h-5" />}
          trend={{ value: 3, positive: false, label: 'vs semana anterior' }}
          variant="danger"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="lg" variant="default">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Confianza Promedio</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1">
                {Math.round(metrics.avgConfidence * 100)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
          </div>
          <Progress value={metrics.avgConfidence * 100} variant="brand" size="sm" className="mt-3" />
        </Card>

        <Card padding="lg" variant="default">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Enrutamiento Automático</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1">
                {metrics.total > 0 ? Math.round((metrics.autoRouted / metrics.total) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <Progress value={(metrics.autoRouted / (metrics.total || 1)) * 100} variant="success" size="sm" className="mt-3" />
        </Card>

        <Card padding="lg" variant="default">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Tasa Auditoría</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1">
                {metrics.auditRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <Progress value={metrics.auditRate} variant="warning" size="sm" className="mt-3" />
        </Card>

        <Card padding="lg" variant="default">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Errores</p>
              <p className="text-3xl font-extrabold text-neutral-950 mt-1">{metrics.errores}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            {metrics.total > 0 ? ((metrics.errores / metrics.total) * 100).toFixed(1) : 0}% de documentos
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Documentos por día */}
        <Card padding="lg" variant="default" className="lg:col-span-2">
          <CardHeader>
            <CardTitle subtitle="Volumen de procesamiento diario">Documentos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-around gap-2">
              {chartData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="w-full flex items-end justify-around gap-1 h-48">
                    <div
                      className="w-full rounded-t bg-brand-500/20 transition-all hover:bg-brand-500/40"
                      style={{ height: `${Math.max((day.procesados / (Math.max(...chartData.map(d => d.total), 1))) * 100, 4)}%` }}
                      title={`Procesados: ${day.procesados}`}
                    />
                    <div
                      className="w-full rounded-t bg-warning-500/20 transition-all hover:bg-warning-500/40"
                      style={{ height: `${Math.max((day.revision / (Math.max(...chartData.map(d => d.total), 1))) * 100, 4)}%` }}
                      title={`En revisión: ${day.revision}`}
                    />
                    <div
                      className="w-full rounded-t bg-danger-500/20 transition-all hover:bg-danger-500/40"
                      style={{ height: `${Math.max((day.urgentes / (Math.max(...chartData.map(d => d.total), 1))) * 100, 4)}%` }}
                      title={`Urgentes: ${day.urgentes}`}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 text-center w-20">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-brand-500/20" />
                <span className="text-neutral-600">Procesados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-warning-500/20" />
                <span className="text-neutral-600">Revisión</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-danger-500/20" />
                <span className="text-neutral-600">Urgentes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Especialidades */}
        <Card padding="lg" variant="default">
          <CardHeader>
            <CardTitle subtitle="Top 6 por volumen">Por Especialidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specialtyData.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">Sin datos</div>
              ) : (
                specialtyData.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-neutral-600 w-8">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${(item.value / specialtyData[0].value) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 tabular-nums">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tipos de documento */}
        <Card padding="lg" variant="default">
          <CardHeader>
            <CardTitle subtitle="Distribución por tipo">Tipos de Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typeData.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">Sin datos</div>
              ) : (
                typeData.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Badge variant="brand" size="sm" className="w-32 text-left justify-start">
                      {item.name}
                    </Badge>
                    <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${(item.value / typeData[0].value) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 tabular-nums w-12 text-right">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prioridad vs Estado */}
        <Card padding="lg" variant="default">
          <CardHeader>
            <CardTitle subtitle="Matriz de prioridad vs estado">Prioridad × Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-400 text-xs uppercase tracking-wide">
                    <th className="pb-2 font-medium"></th>
                    <th className="pb-2 font-medium text-center">Procesados</th>
                    <th className="pb-2 font-medium text-center">En Revisión</th>
                    <th className="pb-2 font-medium text-center">Errores</th>
                    <th className="pb-2 font-medium text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(['Urgente', 'Rutina'] as const).map(priority => {
                    const pDocs = documentos.filter(d => d.prioridad === priority);
                    const processed = pDocs.filter(d => d.status === 'procesado').length;
                    const review = pDocs.filter(d => d.status === 'en_revision').length;
                    const errors = pDocs.filter(d => d.status === 'error').length;
                    const total = pDocs.length;
                    return (
                      <tr key={priority} className="border-t border-neutral-100">
                        <td className="py-2 font-medium text-neutral-900">
                          <Badge variant={priorityColors[priority]} dot size="sm">{priority}</Badge>
                        </td>
                        <td className="py-2 text-center text-success-600 font-semibold">{processed}</td>
                        <td className="py-2 text-center text-warning-600 font-semibold">{review}</td>
                        <td className="py-2 text-center text-danger-600 font-semibold">{errors}</td>
                        <td className="py-2 text-center font-semibold text-neutral-900">{total}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-neutral-200 font-bold">
                    <td className="py-2 text-neutral-900">Total</td>
                    <td className="py-2 text-center text-success-600">{metrics.procesados}</td>
                    <td className="py-2 text-center text-warning-600">{metrics.enRevision}</td>
                    <td className="py-2 text-center text-danger-600">{metrics.errores}</td>
                    <td className="py-2 text-center text-neutral-900">{metrics.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents Table */}
      <Card variant="default">
        <CardHeader>
          <CardTitle subtitle={`${documentos.length} documentos totales`}>Documentos Recientes</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/historial')}>
              Ver todo
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/procesar')}>
              <UploadCloud className="w-4 h-4" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No hay documentos procesados aún</p>
              <Button className="mt-4" onClick={() => navigate('/procesar')}>
                Procesar primer documento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full datatable">
                <thead>
                  <tr>
                    <th className="w-32">ID</th>
                    <th>Tipo</th>
                    <th>Especialidad</th>
                    <th className="w-28">Prioridad</th>
                    <th className="w-28">Estado</th>
                    <th className="w-36">Confianza</th>
                    <th className="w-40">Destino</th>
                    <th className="w-32">Fecha</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.slice(0, 10).map((doc) => (
                    <tr key={doc.documentoId} className="table-row-hover" onClick={() => navigate(`/documentos/${doc.documentoId}`, { state: { documento: doc } })}>
                      <td className="font-mono text-sm text-neutral-900">{doc.documentoId.slice(0, 12)}…</td>
                      <td>
                        <Badge variant="brand" size="sm">{doc.tipo}</Badge>
                      </td>
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
                      <td className="text-sm text-neutral-500 whitespace-nowrap">{new Date(doc.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <Button variant="ghost" size="xs" className="p-1">
                          <Activity className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}