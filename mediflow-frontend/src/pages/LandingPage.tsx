import { useNavigate } from 'react-router-dom';
import { ScanSearch, Route, Database, ArrowRight, Building2, CheckCircle, Zap, Shield, Brain, UploadCloud } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { cn } from '../lib/design-system';

const features = [
  {
    icon: Brain,
    title: 'Clasificación Inteligente',
    description: 'IA multimodal que identifica automáticamente el tipo de documento clínico con 95%+ de precisión.',
    metric: '95%+ precisión',
  },
  {
    icon: Database,
    title: 'Extracción Precisa',
    description: 'Extrae datos de paciente, médico, diagnósticos, CIE-10 y estudios con validación cruzada.',
    metric: 'Campos clave',
  },
  {
    icon: Route,
    title: 'Enrutamiento Automático',
    description: 'Decide el destino óptimo según prioridad clínica, especialidad y disponibilidad en tiempo real.',
    metric: '<2s decisión',
  },
  {
    icon: Shield,
    title: 'Auditoría Humana',
    description: 'Sistema de revisión escalable para casos de baja confianza o ambigüedad crítica.',
    metric: 'Score < 0.60',
  },
  {
    icon: Zap,
    title: 'Procesamiento Rápido',
    description: 'Pipeline optimizado que procesa documentos complejos en segundos, no minutos.',
    metric: '~3s/doc',
  },
  {
    icon: Building2,
    title: 'Almacenamiento Seguro',
    description: 'Respaldo automático en OCI Object Storage con encriptación y versionado.',
    metric: '99.99% durabilidad',
  },
];

const stats = [
  { value: '10K+', label: 'Documentos procesados' },
  { value: '99.2%', label: 'Precisión clasificación' },
  { value: '<3s', label: 'Tiempo promedio' },
  { value: '24/7', label: 'Disponibilidad' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-xl text-neutral-950">MediFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
            <Button size="sm" onClick={() => navigate('/registro')}>
              Comenzar gratis
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(47,111,237,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(47,111,237,0.1),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left animate-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-6 animate-in-delayed">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                Nuevo: IA Gemini 3.7 Flash + Pipeline Híbrido
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-950 leading-[1.1] tracking-tight mb-6 animate-in-delayed stagger-1">
                Documentos clínicos que{' '}
                <span className="text-gradient-brand">se procesan solos</span>
              </h1>

              <p className="text-lg sm:text-xl text-neutral-600 max-w-xl mx-auto lg:mx-0 mb-8 animate-in-delayed stagger-2">
                Clasificación, extracción y enrutamiento inteligente de documentos clínicos con IA multimodal.
                Reduce el trabajo manual en 90% y acelera la atención al paciente.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12 animate-in-delayed stagger-3">
                <Button size="lg" onClick={() => navigate('/registro')} className="w-full sm:w-auto">
                  <ArrowRight className="w-5 h-5" />
                  Probar gratis
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-neutral-500 animate-in-delayed stagger-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Sin tarjeta de crédito
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Setup en 2 minutos
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Cancela cuando quieras
                </div>
              </div>
            </div>

            {/* Visual Demo */}
            <div className="relative animate-in-delayed stagger-2">
              <div className="relative bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                </div>
                <div className="p-6 space-y-4 min-h-[400px]">
                  {/* Document Preview */}
                  <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-16 bg-white rounded-lg border border-neutral-200 flex items-center justify-center shadow-sm">
                        <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Orden de Procedimiento</p>
                        <p className="text-sm text-neutral-500">Hospital Central - Laboratorio</p>
                      </div>
                      <Badge variant="success" dot size="sm" className="ml-auto">PDF</Badge>
                    </div>

                    {/* Processing Animation */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">Analizando con IA...</p>
                          <div className="h-1.5 bg-neutral-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full animate-shimmer" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-success-500" />
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200">
                        <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">Clasificación completada</p>
                          <p className="text-xs text-neutral-500">Orden de Procedimiento • Laboratorio Clínico • Rutina • 94% confianza</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200">
                        <div className="w-8 h-8 rounded-lg bg-info-50 flex items-center justify-center">
                          <Database className="w-4 h-4 text-info-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">Datos extraídos</p>
                          <p className="text-xs text-neutral-500">Paciente: María González • Médico: Dr. Rodríguez • CIE-10: E11.9</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl border bg-brand-50 border-brand-200">
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                          <Route className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-brand-700">Enrutado a: Laboratorio Central</p>
                          <p className="text-xs text-brand-600">Prioridad: Rutina • Sin auditoría requerida • Backup OCI completado</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-4 gap-3 pt-4">
                    {[
                      { icon: Zap, value: '2.3s', label: 'Procesado' },
                      { icon: CheckCircle, value: '94%', label: 'Confianza' },
                      { icon: Shield, value: 'Auto', label: 'Enrutado' },
                      { icon: Building2, value: 'OK', label: 'Backup' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl">
                        <stat.icon className="w-4 h-4 text-brand-500" />
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{stat.value}</p>
                          <p className="text-xs text-neutral-500">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-in-delayed stagger-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-brand-600">{stat.value}</p>
                <p className="text-neutral-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 lg:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-in">
            <Badge variant="brand" size="sm" className="mb-4">Características principales</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mb-4">
              Todo lo que necesitas para{' '}
              <span className="text-gradient-brand">automatizar tu flujo clínico</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Potentes herramientas diseñadas para equipos médicos modernos que necesitan velocidad, precisión y cumplimiento.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} variant="interactive" padding="lg" className="animate-in-delayed">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{feature.title}</h3>
                <p className="text-neutral-600 text-sm mb-4">{feature.description}</p>
                <Badge variant="brand" outline size="sm">{feature.metric}</Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-in">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mb-4">
              Cómo funciona en <span className="text-gradient-brand">3 pasos</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Desde el documento crudo hasta la acción clínica en segundos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Subir documento',
                description: 'Arrastra PDF, imágenes o escaneos. Nuestra IA multimodal procesa cualquier formato.',
                icon: UploadCloud,
              },
              {
                step: '02',
                title: 'IA analiza y extrae',
                description: 'Clasifica tipo, extrae datos clave, sugiere CIE-10 y determina prioridad clínica.',
                icon: Brain,
              },
              {
                step: '03',
                title: 'Enrutamiento automático',
                description: 'Se envía al destino correcto con auditoría humana solo cuando es necesario.',
                icon: Route,
              },
            ].map((step, i) => (
              <div key={i} className="relative animate-in-delayed">
                <div className="absolute -left-6 md:left-0 top-0 w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-extrabold text-xl">
                  {step.step}
                </div>
                <div className="pl-16 md:pl-0">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">{step.title}</h3>
                  <p className="text-neutral-600">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+6px)] w-full h-0.5 bg-gradient-to-r from-brand-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6 animate-in">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            Listo para producción • Cumple HIPAA • SOC 2 Type II
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 animate-in-delayed">
            ¿Listo para transformar tu{' '}
            <span className="text-gradient-brand">procesamiento documental</span>?
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 animate-in-delayed stagger-1">
            Únete a hospitales y clínicas que ya procesan miles de documentos automáticamente con MediFlow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in-delayed stagger-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/registro')}
              className="w-full sm:w-auto bg-white text-neutral-900 hover:bg-white/90"
            >
              <ArrowRight className="w-5 h-5" />
              Comenzar ahora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-extrabold text-xl text-neutral-950">MediFlow</span>
            </div>
            <p className="text-sm text-neutral-500">
              © 2024 MediFlow - Hackathon G10 Latam. Desarrollado con ❤️ para la salud.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}