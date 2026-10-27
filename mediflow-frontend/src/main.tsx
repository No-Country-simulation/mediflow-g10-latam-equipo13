import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import { AuthProvider } from "./lib/api";
import { ToastProvider } from "./components/ui";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import QueuePage from "./pages/QueuePage";
import HistorialPage from "./pages/HistorialPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import UsuariosPage from "./pages/UsuariosPage";
import GuiaPage from "./pages/GuiaPage";
import NotFoundPage from "./pages/NotFoundPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/register" element={<Navigate to="/registro" replace />} />

            {/* Aplicación (requiere sesión) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/inicio" element={<DashboardPage />} />
                <Route path="/procesar" element={<UploadPage />} />
                <Route path="/documentos/:id" element={<DocumentDetailPage />} />
                <Route path="/colas" element={<QueuePage />} />
                <Route path="/historial" element={<HistorialPage />} />
                <Route path="/guia" element={<GuiaPage />} />

                <Route element={<ProtectedRoute roles={["ADMIN", "AUDITOR"]} />}>
                  <Route path="/auditoria" element={<AuditoriaPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/configuracion" element={<ConfiguracionPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
