/**
 * Descargas desde el navegador: historial de triaje en CSV (para Excel) o JSON.
 */
import type { DocumentoUnificado } from './api';

export function descargarArchivo(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  // Se libera después del clic: revocarlo de inmediato puede cancelar la descarga en algunos navegadores.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const hoy = () => new Date().toISOString().slice(0, 10);

/** Celda de CSV: entre comillas y sin fórmulas (un texto que empieza con "=" se ejecutaría en Excel). */
function celda(valor: unknown): string {
  let texto = String(valor ?? '');
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

/** CSV con ";" y BOM: así Excel en español separa las columnas y muestra bien las tildes. */
export function exportarHistorialCsv(docs: DocumentoUnificado[]) {
  const encabezado = [
    'ID documento', 'Fecha', 'Tipo', 'Especialidad', 'Prioridad', 'Confianza (%)', 'Estado',
    'Requiere auditoría', 'Destino', 'Paciente', 'Médico',
  ];
  const filas = docs.map((d) => [
    d.documentoId,
    d.fecha ? new Date(d.fecha).toLocaleString('es-CO') : '',
    d.tipo,
    d.especialidad,
    d.prioridad,
    Math.round(d.scoreConfianza * 100),
    d.status.replace('_', ' '),
    d.requiereAuditoria ? 'Sí' : 'No',
    d.destino,
    d.paciente.nombre,
    d.medico.nombre,
  ]);
  const csv = [encabezado, ...filas].map((fila) => fila.map(celda).join(';')).join('\r\n');
  descargarArchivo(`historial-triaje-${hoy()}.csv`, `﻿${csv}`, 'text/csv;charset=utf-8');
}

export function exportarHistorialJson(docs: DocumentoUnificado[]) {
  descargarArchivo(`historial-triaje-${hoy()}.json`, JSON.stringify(docs, null, 2), 'application/json');
}
