/**
 * Contenido de la guía de cada rol: qué hace la persona en MediFlow y cómo hacerlo paso a paso.
 * Los datos (umbral por defecto, penalizaciones, límites) son los que aplican la app y el agente.
 */
import {
  Activity,
  ClipboardCheck,
  FileSearch,
  ListTree,
  Pencil,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Usuario } from './api';

export type RolConGuia = Exclude<Usuario['rol'], 'NO_ASIGNADO'>;

export interface Responsabilidad {
  titulo: string;
  detalle: string;
  Icono: LucideIcon;
}

export interface PasoGuia {
  titulo: string;
  detalle: string;
  /** Pantalla a la que lleva el paso, si tiene una. */
  ruta?: string;
  pantalla?: string;
}

export interface GuiaRol {
  rol: RolConGuia;
  nombre: string;
  mision: string;
  responsabilidades: Responsabilidad[];
  pasos: PasoGuia[];
  buenasPracticas: string[];
  puede: string[];
  noPuede: string[];
}

export const GUIAS: Record<RolConGuia, GuiaRol> = {
  PERSONAL: {
    rol: 'PERSONAL',
    nombre: 'Operario',
    mision: 'Ingresas los documentos clínicos al agente y das seguimiento a dónde terminó cada uno.',
    responsabilidades: [
      {
        titulo: 'Ingresar documentos',
        detalle: 'Subes PDF, imágenes o fotos de hasta 25 MB, o pegas el texto, e indicas por qué canal llegó.',
        Icono: UploadCloud,
      },
      {
        titulo: 'Revisar el resultado',
        detalle: 'Confirmas la ruta, el destino y la confianza con que decidió el agente.',
        Icono: FileSearch,
      },
      {
        titulo: 'Dar seguimiento',
        detalle: 'Sigues las colas, el historial y las alertas de casos urgentes.',
        Icono: ListTree,
      },
    ],
    pasos: [
      {
        titulo: 'Procesa un documento',
        detalle:
          'Sube el archivo o pega el texto y elige el canal de origen. Si llegó por guardia, márcalo así: el canal también cuenta para detectar la urgencia.',
        ruta: '/procesar',
        pantalla: 'Procesar documento',
      },
      {
        titulo: 'Lee la decisión',
        detalle:
          'Al terminar verás la ruta (estándar, emergencias o revisión humana), el destino y la confianza. Pulsa «Ver decisión completa» para ver el paso a paso del agente.',
      },
      {
        titulo: 'Atiende las alertas',
        detalle: 'La campana de arriba avisa los casos urgentes nuevos y se actualiza cada 20 segundos. Ábrela para ir directo al documento.',
      },
      {
        titulo: 'Sigue las colas',
        detalle: 'Ves cuántos documentos hay en cada destino, en vista de tabla o de tablero, y filtras por prioridad o estado.',
        ruta: '/colas',
        pantalla: 'Colas de enrutamiento',
      },
      {
        titulo: 'Busca y exporta',
        detalle: 'Filtras por tipo, prioridad, estado y fechas, y exportas a CSV. Con Ctrl + K buscas un paciente desde cualquier pantalla.',
        ruta: '/historial',
        pantalla: 'Historial',
      },
    ],
    buenasPracticas: [
      'Usa el modo Persistente: guarda el documento y lo enruta. El modo Directo solo analiza y no guarda nada.',
      'Elige bien el canal de origen: un documento que entra por guardia se trata como urgente.',
      'Sube documentos legibles y completos: cada dato que falta baja la confianza.',
      'Si un resultado no te parece correcto, avisa a un auditor en lugar de volver a subir el mismo documento.',
      'Nunca uses documentos de pacientes reales en pruebas o demostraciones.',
    ],
    puede: ['Inicio', 'Procesar documento', 'Colas de enrutamiento', 'Historial'],
    noPuede: ['Auditoría humana', 'Usuarios y roles', 'Reglas de triaje'],
  },

  AUDITOR: {
    rol: 'AUDITOR',
    nombre: 'Auditor',
    mision: 'Decides los casos que el agente no puede resolver solo: revisas, corriges o rechazas lo que extrajo la IA.',
    responsabilidades: [
      {
        titulo: 'Revisar casos dudosos',
        detalle: 'Atiendes la cola de Auditoría humana: confianza bajo el umbral, ambigüedad o medicamentos de alto riesgo.',
        Icono: ShieldCheck,
      },
      {
        titulo: 'Corregir la extracción',
        detalle: 'Comparas el original con los datos extraídos y corriges lo que la IA leyó mal.',
        Icono: Pencil,
      },
      {
        titulo: 'Dejar constancia',
        detalle: 'Cada decisión queda registrada con tu nombre, la fecha y tu comentario.',
        Icono: ClipboardCheck,
      },
    ],
    pasos: [
      {
        titulo: 'Abre la cola de pendientes',
        detalle: 'Primero aparecen los urgentes y, dentro de cada grupo, los de menor confianza.',
        ruta: '/auditoria',
        pantalla: 'Auditoría humana',
      },
      {
        titulo: 'Lee por qué llegó ahí',
        detalle: 'Arriba del caso está la justificación del agente: qué dato faltó, qué no cuadró o qué medicamento de alto riesgo detectó.',
      },
      {
        titulo: 'Compara con el original',
        detalle:
          'En «Archivo» ves el documento tal como llegó; si no está disponible, usa «Texto extraído». Revisa paciente, médico, estudio, diagnóstico, CIE-10 y prioridad.',
      },
      {
        titulo: 'Decide',
        detalle:
          'Si todo está bien, pulsa «Aprobar extracción». Si corriges un campo, el botón cambia a «Guardar corrección y aprobar». Si el documento no sirve, «Rechazar», con un motivo de al menos 5 caracteres.',
      },
      {
        titulo: 'Consulta lo ya decidido',
        detalle: 'En la pestaña Revisados ves cada decisión con su autor, fecha y comentario.',
        ruta: '/auditoria',
        pantalla: 'Auditoría humana',
      },
    ],
    buenasPracticas: [
      'Atiende primero los urgentes: aunque estén en revisión, la alerta a la guardia ya salió.',
      'No apruebes lo que no puedes leer en el original: si falta un dato clave, rechaza y pide el documento de nuevo.',
      'Revisa con más cuidado los medicamentos de alto riesgo, como insulina, heparina o morfina: dosis, vía y frecuencia.',
      'Escribe comentarios claros: sirven de evidencia y ayudan a ajustar las reglas.',
      'Si ves el mismo error muchas veces, avisa al administrador para que revise el umbral o los términos de urgencia.',
    ],
    puede: ['Inicio', 'Procesar documento', 'Colas de enrutamiento', 'Auditoría humana', 'Historial'],
    noPuede: ['Usuarios y roles', 'Reglas de triaje'],
  },

  ADMIN: {
    rol: 'ADMIN',
    nombre: 'Administrador',
    mision: 'Administras MediFlow: decides quién entra y con qué permisos, y ajustas las reglas con que decide el agente.',
    responsabilidades: [
      {
        titulo: 'Gestionar personas',
        detalle: 'Apruebas las cuentas nuevas y asignas el rol de cada persona.',
        Icono: Users,
      },
      {
        titulo: 'Ajustar las reglas',
        detalle: 'Defines el umbral de confianza, los términos de urgencia y el destino de cada tipo de documento.',
        Icono: SlidersHorizontal,
      },
      {
        titulo: 'Vigilar la operación',
        detalle: 'Sigues las métricas de Inicio y el estado del motor de IA y de la API.',
        Icono: Activity,
      },
    ],
    pasos: [
      {
        titulo: 'Aprueba las cuentas nuevas',
        detalle: 'Quien se registra entra como «Sin asignar» y no puede usar MediFlow. Asígnale Operario, Auditor o Administrador.',
        ruta: '/usuarios',
        pantalla: 'Usuarios y roles',
      },
      {
        titulo: 'Ajusta el umbral de confianza',
        detalle:
          'Por debajo de este valor un documento va a revisión humana. Por defecto es 60 %: subirlo manda más casos a auditoría; bajarlo automatiza más.',
        ruta: '/configuracion',
        pantalla: 'Reglas de triaje',
      },
      {
        titulo: 'Mantén los términos de urgencia',
        detalle: 'Agrega o quita palabras como «infarto» o «sepsis». Si aparecen en un documento, el agente lo trata como urgente.',
        ruta: '/configuracion',
        pantalla: 'Reglas de triaje',
      },
      {
        titulo: 'Revisa los destinos',
        detalle: 'Cada tipo de documento tiene una cola de destino. Los cambios valen desde el siguiente documento, sin tocar código.',
        ruta: '/configuracion',
        pantalla: 'Reglas de triaje',
      },
      {
        titulo: 'Vigila la salud del sistema',
        detalle:
          'En la barra lateral, «Estado del agente» muestra si el motor de IA y la API están en línea. En Reglas de triaje, «Conexiones» permite probarlos.',
      },
      {
        titulo: 'Mide y exporta',
        detalle:
          'Inicio resume la confianza promedio y cuántos documentos se resolvieron sin intervención humana. Exporta el historial en JSON o CSV para tus reportes.',
        ruta: '/inicio',
        pantalla: 'Inicio',
      },
    ],
    buenasPracticas: [
      'Asigna a cada persona el rol mínimo que necesita para su trabajo.',
      'Mueve el umbral de a poco y mira el efecto en Inicio antes de volver a cambiarlo.',
      'Ten al menos dos administradores para no quedarte sin acceso.',
      'Cuando alguien deja el equipo, pásalo a «Sin asignar».',
      'Nunca compartas claves ni datos reales de pacientes en los canales del equipo.',
    ],
    puede: [
      'Inicio',
      'Procesar documento',
      'Colas de enrutamiento',
      'Auditoría humana',
      'Historial',
      'Usuarios y roles',
      'Reglas de triaje',
    ],
    noPuede: [],
  },
};

/** Orden en que el administrador ve los roles para consultar la guía de los demás. */
export const ORDEN_ROLES: RolConGuia[] = ['ADMIN', 'AUDITOR', 'PERSONAL'];

export const RUTAS_AGENTE = [
  {
    nombre: 'Flujo estándar',
    punto: 'bg-success-500',
    detalle: 'Documento claro y no urgente: va al destino de su tipo, sin intervención humana.',
  },
  {
    nombre: 'Emergencias',
    punto: 'bg-danger-500',
    detalle: 'Hallazgo crítico, término de urgencia o ingreso por guardia: va a la Cola de Emergencia Médica y avisa a la guardia.',
  },
  {
    nombre: 'Revisión humana',
    punto: 'bg-warning-500',
    detalle: 'Confianza bajo el umbral, ambigüedad o medicamento de alto riesgo: lo decide un auditor. Pesa más que la urgencia.',
  },
] as const;

export const GLOSARIO: { termino: string; definicion: string }[] = [
  {
    termino: 'Confianza',
    definicion:
      'Lo segura que está la IA de su lectura, menos 8 puntos por dato faltante, 6 por inconsistencia y 10 por ambigüedad. No es una probabilidad.',
  },
  { termino: 'Umbral', definicion: 'La confianza mínima para enrutar sin revisión humana. Lo define el administrador.' },
  { termino: 'Ruta', definicion: 'El camino que tomó el documento: estándar, emergencias o revisión humana.' },
  { termino: 'Destino', definicion: 'La cola a la que llega el documento, por ejemplo Farmacia_Hospitalaria.' },
  { termino: 'Canal de origen', definicion: 'Por dónde llegó el documento: consulta externa, guardia, laboratorio, imágenes o admisión.' },
  { termino: 'CIE-10', definicion: 'Código internacional del diagnóstico que sugiere la IA, por ejemplo G44.2.' },
  { termino: 'Traza', definicion: 'El registro paso a paso de lo que hizo el agente con cada documento.' },
];
