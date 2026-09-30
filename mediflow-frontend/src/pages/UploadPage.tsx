import { useState, useRef } from "react";
import { UploadCloud, FolderOpen, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { procesarDocumento } from "../lib/api";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProcesando(true);
    try {
      const resultado = await procesarDocumento(file);
      navigate(`/documentos/${resultado.documento_id}`, { state: { documento: resultado } });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo conectar con el backend. Verifica que esté corriendo en el puerto configurado."
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-extrabold text-ink">Procesar documento clínico</h1>
      <p className="text-slate-500 text-sm mt-1 max-w-md">
        Sube un archivo y nuestro agente inteligente se encargará de clasificarlo, extraer la información y enrutarlo automáticamente.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`mt-6 rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-colors ${
          dragOver ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {procesando ? (
          <>
            <Loader2 className="w-9 h-9 text-brand-500 animate-spin mb-3" />
            <p className="text-slate-600 font-medium">Procesando documento…</p>
            <p className="text-slate-400 text-xs mt-1">Esto puede tardar unos segundos mientras el modelo analiza el archivo.</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7 text-brand-500" />
            </div>
            <p className="text-ink font-semibold">
              Arrastra un archivo aquí o <span className="text-brand-500">selecciona</span>
            </p>
            <p className="text-slate-400 text-sm mt-1">Formatos soportados: PDF, imágenes (JPG, PNG), JSON</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
            >
              Seleccionar archivo
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-urgent/5 border border-urgent/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-urgent shrink-0 mt-0.5" />
          <div>
            <p className="text-urgent font-semibold text-sm">No se pudo procesar el documento</p>
            <p className="text-slate-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          <FolderOpen className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ink text-sm">Documentos de prueba</p>
          <p className="text-slate-400 text-xs mt-0.5">También puedes usar los archivos de prueba incluidos en el paquete del proyecto.</p>
        </div>
        <button className="text-brand-500 text-sm font-semibold whitespace-nowrap">Ver carpeta recibidos/</button>
      </div>
    </div>
  );
}
