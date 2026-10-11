/**
 * Casos de prueba sintéticos para la demostración (no contienen datos reales de pacientes).
 * Cubren los tres escenarios que exige el brief: rutina, urgencia y ambigüedad.
 */
export type Escenario = 'rutina' | 'urgencia' | 'ambiguo';

export interface CasoDemo {
  id: string;
  escenario: Escenario;
  titulo: string;
  descripcion: string;
  canalOrigen: string;
  texto: string;
}

export const CASOS_DEMO: CasoDemo[] = [
  {
    id: 'DEMO-RUTINA',
    escenario: 'rutina',
    titulo: 'Receta estándar',
    descripcion: 'Receta médica legible y completa: debería procesarse sin intervención humana.',
    canalOrigen: 'Consulta_Externa',
    texto: `CENTRO MEDICO LOS ALAMOS - RECETA MEDICA
Paciente: Marta Lucia Rojas Pineda, 41 años. RUT 12.345.678-5
Medico: Dr. Andres Felipe Cardenas, Medicina General, MP 20311
Fecha: 14/09/2026
Diagnostico: Cefalea tensional (G44.2)
Rp:
1) Paracetamol 500 mg - 1 comprimido cada 8 horas por 5 dias, via oral, en caso de cefalea.
2) Ibuprofeno 400 mg - 1 comprimido cada 12 horas por 3 dias, via oral, con alimentos.
Indicaciones: control en 7 dias si persisten los sintomas.`,
  },
  {
    id: 'DEMO-URGENCIA',
    escenario: 'urgencia',
    titulo: 'Informe crítico (TEP agudo)',
    descripcion: 'Hallazgo grave en tomografía: debería clasificarse como Urgente y generar alerta a guardia.',
    canalOrigen: 'Guardia_Emergencias',
    texto: `HOSPITAL SANTA LUCIA - INFORME DE ESTUDIO RADIOLOGICO.
Paciente: Carlos Eduardo Mendes, 52 anos.
Medico Solicitante: Dra. Renata Silveira MP 145892.
Estudio: Tomografia de Torax con contraste.
Indicacion: Sospecha de embolia pulmonar aguda, disnea subita.
Hallazgos: Defecto de llenado en arteria pulmonar principal derecha compatible con TEP agudo.
CONCLUSION: Cuadro compatible con Tromboembolismo Pulmonar Agudo. Se sugiere correlacion clinica urgente.`,
  },
  {
    id: 'DEMO-AMBIGUO',
    escenario: 'ambiguo',
    titulo: 'Documento ilegible / incompleto',
    descripcion: 'Datos faltantes y texto ilegible: debería derivarse a auditoría humana con confianza baja.',
    canalOrigen: 'Admision',
    texto: `Clinica ???? - orden
Pcte: [ilegible] edad ?? 
Dr/a: firma ilegible   matricula: ----
Estudio: ec... [borrado] abdo?
Dx: dolor, no se lee bien
Indic.: ver anexo (no adjunto)
Obs: valores en mg ??? posible duplicacion con receta anterior`,
  },
];

export const ESCENARIO_META: Record<Escenario, { label: string; variant: 'success' | 'danger' | 'warning' }> = {
  rutina: { label: 'Rutina', variant: 'success' },
  urgencia: { label: 'Urgencia', variant: 'danger' },
  ambiguo: { label: 'Ambiguo', variant: 'warning' },
};

export const CANALES_ORIGEN = [
  'Consulta_Externa',
  'Guardia_Emergencias',
  'Laboratorio',
  'Imagenes',
  'Admision',
  'Otro',
] as const;
