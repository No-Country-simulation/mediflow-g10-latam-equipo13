import type { DocumentoProcesado } from "../types/mediflow";

// URL base del backend FastAPI. Ajustar según entorno (local / OCI Compute).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function procesarDocumento(file: File): Promise<DocumentoProcesado> {
  const formData = new FormData();
  formData.append("documento", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/documentos/procesar`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error al procesar el documento: ${response.status}`);
  }

  return response.json();
}

export async function obtenerDocumento(id: string): Promise<DocumentoProcesado> {
  const response = await fetch(`${API_BASE_URL}/api/v1/documentos/${id}`);
  if (!response.ok) {
    throw new Error(`Documento no encontrado: ${id}`);
  }
  return response.json();
}

export async function listarDocumentos(): Promise<DocumentoProcesado[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/documentos`);
  if (!response.ok) {
    throw new Error("No se pudo obtener el listado de documentos");
  }
  return response.json();
}
