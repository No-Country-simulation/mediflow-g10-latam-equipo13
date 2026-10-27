/**
 * Respuestas guardadas del asistente virtual. Se usan al pulsar una sugerencia (respuesta al instante)
 * y como respaldo cuando la IA no responde a tiempo o el servidor no está disponible.
 */
import { GUIAS, ORDEN_ROLES, type RolConGuia } from './guiaRoles';

export interface RespuestaLocal {
  texto: string;
  ruta?: string;
  pantalla?: string;
}

interface Entrada {
  id: string;
  /** Raíces de palabras o frases (sin tildes): cada coincidencia suma 1. */
  claves: string[];
  /** Coincidencias que pesan el doble porque identifican bien el tema. */
  fuertes?: string[];
  /** Roles que pueden hacer lo que explica la respuesta. Sin valor: todos. */
  roles?: RolConGuia[];
  respuesta: string | ((rol: RolConGuia | null) => string);
  ruta?: string;
  pantalla?: string;
}

const listaRoles = (roles: RolConGuia[]) =>
  roles.map((r) => `**${GUIAS[r].nombre}**`).join(roles.length === 2 ? ' o ' : ', ');

const ENTRADAS: Entrada[] = [
  {
    id: 'saludo',
    claves: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'gracias'],
    respuesta:
      '¡Hola! Soy el asistente de MediFlow. Pregúntame cómo usar una pantalla, qué puede hacer tu rol o cómo decide el agente.',
  },
  {
    id: 'que-es',
    claves: ['mediflow', 'para que sirve', 'que es', 'de que trata'],
    respuesta:
      'MediFlow es un agente de IA que hace el triaje de documentos clínicos: los lee, los clasifica, extrae sus datos y decide a qué cola van. Los urgentes generan una alerta y los dudosos los decide una persona.\n\nNuestro principio: la IA extrae, las reglas deciden y, cuando hay dudas, decide una persona.',
  },
  {
    id: 'procesar',
    claves: ['document', 'archivo', 'pdf', 'foto', 'imagen', 'pegar', 'cargar', 'cargo'],
    fuertes: ['proces', 'subir', 'subo', 'escane'],
    respuesta:
      '1. Ve a **Procesar documento**.\n2. Elige **Subir archivo** (PDF, imagen o texto, hasta 25 MB), **Pegar texto** o **Casos de prueba**.\n3. Indica el **canal de origen** y deja el modo **Persistente**.\n4. Pulsa **Procesar** y espera unos segundos.\n5. Revisa la ruta, el destino y la confianza; en **Ver decisión completa** está el paso a paso.',
    ruta: '/procesar',
    pantalla: 'Procesar documento',
  },
  {
    id: 'decision',
    claves: ['agente', 'ruta', 'criterio', 'grafo'],
    fuertes: ['decide', 'decision', 'como funciona', 'por que llego', 'por que llega', 'por que se fue'],
    respuesta:
      'El agente lee el documento con Gemini, valida los datos y calcula la confianza. Luego elige una de 3 rutas:\n- **Revisión humana**: confianza bajo el umbral, ambigüedad o medicamento de alto riesgo.\n- **Emergencias**: hallazgo crítico, término de urgencia o ingreso por guardia; avisa a la guardia.\n- **Flujo estándar**: va al destino de su tipo, por ejemplo una receta a Farmacia_Hospitalaria.\nLa revisión humana pesa más que la urgencia.',
  },
  {
    id: 'confianza',
    claves: ['porcentaje', 'score', 'penaliz', 'probabilidad'],
    fuertes: ['confianza'],
    respuesta:
      'La confianza es lo segura que está la IA de su lectura, menos 8 puntos por dato faltante, 6 por inconsistencia y 10 por ambigüedad. No es una probabilidad.\n\nSi queda bajo el **umbral** (60 % por defecto), el documento pasa a **Auditoría humana**.',
  },
  {
    id: 'reglas',
    claves: ['configur', 'destinos', 'termino', 'cambi', 'ajust'],
    fuertes: ['umbral', 'reglas de triaje', 'regla', 'terminos de urgencia'],
    roles: ['ADMIN'],
    respuesta:
      'En **Reglas de triaje** se cambian:\n- El **umbral de confianza**: por debajo, el documento va a revisión humana.\n- Los **términos de urgencia**, como «infarto» o «sepsis».\n- El **destino** de cada tipo de documento.\nLos cambios valen desde el siguiente documento, sin tocar código.',
    ruta: '/configuracion',
    pantalla: 'Reglas de triaje',
  },
  {
    id: 'auditoria',
    claves: ['revis', 'aprob', 'aprueb', 'corrig', 'correg', 'dudos', 'pendiente', 'caso'],
    fuertes: ['auditor', 'rechaz'],
    roles: ['ADMIN', 'AUDITOR'],
    respuesta:
      '1. Ve a **Auditoría humana**: primero salen los urgentes y los de menor confianza.\n2. Lee la justificación del agente.\n3. Compara el original (**Archivo** o **Texto extraído**) con los datos.\n4. Pulsa **Aprobar extracción**; si corriges un campo, **Guardar corrección y aprobar**; o **Rechazar**, con un motivo de al menos 5 caracteres.',
    ruta: '/auditoria',
    pantalla: 'Auditoría humana',
  },
  {
    id: 'usuarios',
    claves: ['usuario', 'acceso', 'permiso', 'rol'],
    fuertes: ['registr', 'cuenta', 'sin asignar', 'asign', 'nuevo usuario', 'dar de alta'],
    roles: ['ADMIN'],
    respuesta:
      '1. Ve a **Usuarios y roles**.\n2. Busca a la persona: las cuentas nuevas aparecen como **Sin asignar**.\n3. Elige su rol: **Operario**, **Auditor** o **Administrador** (este último pide confirmación).\nHasta que tenga un rol, esa persona no puede usar MediFlow.',
    ruta: '/usuarios',
    pantalla: 'Usuarios y roles',
  },
  {
    id: 'roles',
    claves: ['rol', 'roles', 'funciones', 'mi trabajo'],
    fuertes: ['que puedo', 'puedo hacer', 'cada rol', 'que hace un', 'que hace el'],
    respuesta: (rol) => {
      if (rol && rol !== 'ADMIN') {
        const g = GUIAS[rol];
        return `Como **${g.nombre}**: ${g.mision}\n\nPuedes usar: ${g.puede.join(', ')}. Para el paso a paso, abre **Guía de mi rol**.`;
      }
      return ORDEN_ROLES.map((r) => `- **${GUIAS[r].nombre}**: ${GUIAS[r].mision}`).join('\n') +
        '\n- **Sin asignar**: cuenta nueva; no puede usar MediFlow hasta que un administrador le asigne un rol.';
    },
    ruta: '/guia',
    pantalla: 'Guía de mi rol',
  },
  {
    id: 'urgencias',
    claves: ['emergencia', 'guardia', 'notific', 'aviso'],
    fuertes: ['urgen', 'alerta', 'campana'],
    respuesta:
      'Un documento es urgente si la IA lo marca así, tiene un hallazgo crítico, menciona un término de urgencia (infarto, sepsis, TEP…) o llega por guardia.\n\nVa a la **Cola de Emergencia Médica** y la **campana** de arriba avisa: revisa los casos nuevos cada 20 segundos. Ábrela para ir directo al documento.',
  },
  {
    id: 'colas',
    claves: ['destino', 'farmacia', 'tablero'],
    fuertes: ['cola', 'kanban'],
    respuesta:
      'En **Colas de enrutamiento** ves los documentos por destino (farmacia, historia clínica, autorizaciones, emergencias y revisión humana), en vista de tabla o de tablero, con filtros de prioridad y estado.',
    ruta: '/colas',
    pantalla: 'Colas de enrutamiento',
  },
  {
    id: 'historial',
    claves: ['buscar', 'busco', 'filtr', 'paciente', 'descarg'],
    fuertes: ['historial', 'export', 'csv', 'ctrl'],
    respuesta:
      'En **Historial** está todo lo procesado, con filtros por tipo, especialidad, prioridad, estado y fechas, y el botón **Exportar CSV**. En **Inicio** puedes **Exportar JSON**.\n\nPara buscar un paciente rápido, pulsa **Ctrl + K** desde cualquier pantalla.',
    ruta: '/historial',
    pantalla: 'Historial',
  },
  {
    id: 'modos',
    fuertes: ['persistente', 'directo', 'modo'],
    claves: [],
    respuesta:
      '**Persistente** guarda el documento y lo enruta: es el que se usa siempre. **Directo** solo analiza y no guarda nada; está disponible solo en desarrollo local.',
  },
  {
    id: 'casos-prueba',
    claves: ['ejemplo', 'demo'],
    fuertes: ['casos de prueba', 'caso de prueba', 'escenario', 'probar'],
    respuesta:
      'En **Procesar documento → Casos de prueba** hay 3 documentos inventados:\n- **Receta estándar**: rutina, sin intervención humana.\n- **Informe crítico (TEP agudo)**: urgencia, con alerta.\n- **Documento ilegible**: pasa a revisión humana.\nÚsalos para probar sin datos reales.',
    ruta: '/procesar',
    pantalla: 'Procesar documento',
  },
  {
    id: 'privacidad',
    claves: ['seguridad', 'proteg', 'confidencial'],
    fuertes: ['privacidad', 'datos reales', 'datos personales'],
    respuesta:
      'Para entrar hay que iniciar sesión, las contraseñas se guardan cifradas y los permisos de cada rol se validan en el servidor. Los registros no guardan contenido clínico y el archivo que se envía a Gemini se borra al terminar. En pruebas y demostraciones usa solo datos inventados.',
  },
  {
    id: 'tecnologia',
    claves: ['react', 'spring', 'python', 'gemini', 'langgraph', 'stack'],
    fuertes: ['tecnolog', 'como esta hecho', 'con que esta hecho'],
    respuesta:
      'Frontend en React y TypeScript (Vercel); API en Java con Spring Boot y MySQL (Railway); motor de IA en Python con FastAPI, LangGraph y Google Gemini, en una red privada (Railway); respaldo de documentos en OCI Object Storage.',
  },
  {
    id: 'conexion',
    claves: ['error', 'lento', 'tarda', 'motor'],
    fuertes: ['sin conexion', 'no funciona', 'no carga', 'caido', 'falla'],
    respuesta:
      'Mira **Estado del agente** en la barra lateral. Si el **Motor de IA** está sin conexión, espera unos segundos y vuelve a intentar: si Gemini está saturado, el motor cambia solo de modelo. Si sigue fallando, avisa al administrador, que puede probar los servicios en **Reglas de triaje → Conexiones**.',
  },
  {
    id: 'guia',
    claves: ['ayuda', 'manual', 'tutorial'],
    fuertes: ['guia'],
    respuesta: 'Abre **Guía de mi rol** desde el menú de tu usuario, arriba a la derecha: explica tu trabajo paso a paso.',
    ruta: '/guia',
    pantalla: 'Guía de mi rol',
  },
  {
    id: 'clinico',
    claves: [],
    fuertes: ['diagnost', 'tratamiento', 'sintoma', 'dolor', 'enfermedad', 'que le doy', 'recetar', 'receto'],
    respuesta:
      'No puedo dar diagnósticos ni recomendaciones médicas: MediFlow clasifica y enruta documentos, y las decisiones clínicas son de los profesionales. ¿Te ayudo con algo de la aplicación?',
  },
];

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Una clave de una palabra cuenta si alguna palabra empieza con ella; una frase, si aparece tal cual. */
const coincide = (texto: string, palabras: string[], clave: string) =>
  clave.includes(' ') ? ` ${texto} `.includes(` ${clave}`) : palabras.some((p) => p.startsWith(clave));

function construir(entrada: Entrada, rol: RolConGuia | null): RespuestaLocal {
  const base = typeof entrada.respuesta === 'function' ? entrada.respuesta(rol) : entrada.respuesta;
  const sinAcceso = !!rol && !!entrada.roles && !entrada.roles.includes(rol);
  if (sinAcceso) {
    return {
      texto: `Con tu rol (**${GUIAS[rol].nombre}**) no tienes acceso a esto: lo hace ${listaRoles(entrada.roles!)}.\n\n${base}`,
    };
  }
  return { texto: base, ruta: entrada.ruta, pantalla: entrada.pantalla };
}

/**
 * Respuesta guardada más parecida a la pregunta, o null si ninguna llega a `minimo` puntos.
 * Con un mínimo alto sirve para ofrecer el enlace a la pantalla junto a una respuesta de la IA.
 */
export function responderLocal(pregunta: string, rol: RolConGuia | null, minimo = 1): RespuestaLocal | null {
  const texto = normalizar(pregunta);
  const palabras = texto.split(' ');
  let mejor: { entrada: Entrada; puntos: number } | null = null;
  for (const entrada of ENTRADAS) {
    const puntos =
      entrada.claves.filter((c) => coincide(texto, palabras, c)).length +
      2 * (entrada.fuertes ?? []).filter((c) => coincide(texto, palabras, c)).length;
    if (puntos >= minimo && (!mejor || puntos > mejor.puntos)) mejor = { entrada, puntos };
  }
  return mejor ? construir(mejor.entrada, rol) : null;
}

export function respuestaPorId(id: string, rol: RolConGuia | null): RespuestaLocal | null {
  const entrada = ENTRADAS.find((e) => e.id === id);
  return entrada ? construir(entrada, rol) : null;
}

export interface Sugerencia {
  texto: string;
  id: string;
}

export const SUGERENCIAS: Record<RolConGuia, Sugerencia[]> = {
  PERSONAL: [
    { texto: '¿Cómo proceso un documento?', id: 'procesar' },
    { texto: '¿Cómo sé si un caso es urgente?', id: 'urgencias' },
    { texto: '¿Qué significa la confianza?', id: 'confianza' },
    { texto: '¿Qué puedo hacer con mi rol?', id: 'roles' },
  ],
  AUDITOR: [
    { texto: '¿Cómo reviso un caso dudoso?', id: 'auditoria' },
    { texto: '¿Por qué un caso llega a revisión?', id: 'decision' },
    { texto: '¿Qué significa la confianza?', id: 'confianza' },
    { texto: '¿Qué puedo hacer con mi rol?', id: 'roles' },
  ],
  ADMIN: [
    { texto: '¿Cómo apruebo una cuenta nueva?', id: 'usuarios' },
    { texto: '¿Cómo cambio las reglas de triaje?', id: 'reglas' },
    { texto: '¿Cómo decide el agente?', id: 'decision' },
    { texto: '¿Qué puede hacer cada rol?', id: 'roles' },
  ],
};

export const RESPUESTA_SIN_COINCIDENCIA =
  'No tengo una respuesta guardada para eso y ahora no pude consultar a la IA. Prueba con una de las sugerencias o abre **Guía de mi rol** en el menú de tu usuario.';
