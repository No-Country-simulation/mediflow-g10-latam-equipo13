import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import LandingPage from "./pages/LandingPage";
import AppShell from "./components/AppShell";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import QueuePage from "./pages/QueuePage";
import HistorialPage from "./pages/HistorialPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppShell />}>
          <Route path="/inicio" element={<DashboardPage />} />
          <Route path="/procesar" element={<UploadPage />} />
          <Route path="/documentos/:id" element={<DocumentDetailPage />} />
          <Route path="/colas" element={<QueuePage />} />
          <Route path="/historial" element={<HistorialPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);