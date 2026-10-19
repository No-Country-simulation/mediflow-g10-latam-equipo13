import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileWarning, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui';
import { mensajeError, springApi } from '../lib/api';
import { detectarTipoArchivo, type TipoArchivo } from '../lib/archivo';

interface DocumentViewerProps {
  /** Id numérico del documento guardado en el servidor. null = el documento no se guardó. */
  documentoId: number | null;
  /** Si el archivo no está disponible, ofrece cambiar al texto extraído. */
  onVerTexto?: () => void;
  altura?: number;
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error'; mensaje: string }
  | { fase: 'listo'; url: string; tipo: TipoArchivo };

export default function DocumentViewer({ documentoId, onVerTexto, altura = 560 }: DocumentViewerProps) {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (documentoId === null) {
      setEstado({ fase: 'error', mensaje: 'Este documento no se guardó en el servidor, por eso no hay archivo que mostrar.' });
      return;
    }

    const ctrl = new AbortController();
    let urlCreada: string | null = null;
    setEstado({ fase: 'cargando' });
    setZoom(1);

    (async () => {
      try {
        const { blob } = await springApi.obtenerArchivoDocumento(documentoId, ctrl.signal);
        const tipo = await detectarTipoArchivo(blob);
        if (ctrl.signal.aborted) return;
        // Se vuelve a tipar el blob para que el navegador lo muestre aunque el servidor mande un Content-Type genérico.
        urlCreada = URL.createObjectURL(new Blob([blob], { type: tipo.mime }));
        setEstado({ fase: 'listo', url: urlCreada, tipo });
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setEstado({ fase: 'error', mensaje: mensajeError(e, 'No se pudo cargar el archivo') });
      }
    })();

    return () => {
      ctrl.abort();
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [documentoId]);

  if (estado.fase === 'cargando') {
    return (
      <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm rounded-lg bg-neutral-50" style={{ height: altura }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando documento…
      </div>
    );
  }

  if (estado.fase === 'error') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-center rounded-lg bg-neutral-50 border border-dashed border-neutral-200 p-6"
        style={{ minHeight: 240 }}
      >
        <FileWarning className="w-10 h-10 text-neutral-300" />
        <p className="text-sm text-neutral-600 max-w-xs">{estado.mensaje}</p>
        {onVerTexto && (
          <Button variant="outline" size="sm" onClick={onVerTexto}>
            Ver texto extraído
          </Button>
        )}
      </div>
    );
  }

  const { url, tipo } = estado;
  const nombre = `documento-${documentoId}.${tipo.extension}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {tipo.clase === 'imagen' && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
                disabled={zoom <= 1}
                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
                aria-label="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-neutral-500 tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))}
                disabled={zoom >= 4}
                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
                aria-label="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir
          </a>
          <a
            href={url}
            download={nombre}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <Download className="w-3.5 h-3.5" /> Descargar
          </a>
        </div>
      </div>

      {tipo.clase === 'pdf' && (
        <iframe
          src={`${url}#view=FitH`}
          title="Documento original"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-100"
          style={{ height: altura }}
        />
      )}

      {tipo.clase === 'imagen' && (
        <div className="overflow-auto rounded-lg border border-neutral-200 bg-neutral-100" style={{ height: altura }}>
          <img src={url} alt="Documento original" style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} className="block" />
        </div>
      )}

      {tipo.clase === 'otro' && (
        <div className="flex flex-col items-center justify-center gap-2 text-center rounded-lg bg-neutral-50 border border-dashed border-neutral-200 p-6" style={{ minHeight: 200 }}>
          <FileWarning className="w-8 h-8 text-neutral-300" />
          <p className="text-sm text-neutral-600">No hay vista previa para este tipo de archivo. Puedes descargarlo.</p>
        </div>
      )}
    </div>
  );
}
