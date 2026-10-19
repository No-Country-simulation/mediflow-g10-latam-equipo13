/** Detecta el tipo real de un archivo por sus primeros bytes (el servidor puede mandar un Content-Type genérico). */
export type ClaseArchivo = 'pdf' | 'imagen' | 'otro';

export interface TipoArchivo {
  clase: ClaseArchivo;
  mime: string;
  extension: string;
}

export async function detectarTipoArchivo(blob: Blob): Promise<TipoArchivo> {
  const b = new Uint8Array(await blob.slice(0, 8).arrayBuffer());

  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
    return { clase: 'pdf', mime: 'application/pdf', extension: 'pdf' };
  }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { clase: 'imagen', mime: 'image/png', extension: 'png' };
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { clase: 'imagen', mime: 'image/jpeg', extension: 'jpg' };
  }

  const declarado = blob.type || 'application/octet-stream';
  if (declarado.includes('pdf')) return { clase: 'pdf', mime: 'application/pdf', extension: 'pdf' };
  if (declarado.startsWith('image/')) return { clase: 'imagen', mime: declarado, extension: declarado.split('/')[1] || 'img' };
  return { clase: 'otro', mime: declarado, extension: declarado.includes('json') ? 'json' : 'bin' };
}
