import { Navigate, Route, Routes } from 'react-router-dom'

// Layouts
import AdminLayout from './layouts/AdminLayout.tsx'
import VigilanteLayout from './layouts/VigilanteLayout.tsx'

// Páginas
import AccesoPage from './pages/Acceso.jsx'
import AuditoriaPage from './pages/AuditoriaPage.jsx'
import DashboardAdminPage from './pages/DashboardAdminPage.tsx'
import DashboardVigilantePage from './pages/DashboardVigilantePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import PersonasPage from './pages/PersonasPage.jsx'
import ReportesPage from './pages/ReportesPage.jsx'
import VehiculosPage from './pages/VehiculosPage.jsx'
import GestionPage from './pages/GestionPage.jsx'
import GestionVigilante from './pages/GestionVigilante.jsx'
import AlertasPage from './pages/AlertasPage.jsx'
import CalendarioAdmin from './pages/CalendarioAdmin.jsx'
import CalendarioVigilante from './pages/CalendarioVigilante.jsx'
import VehiculosDentro from './pages/VehiculosDentro.jsx'


export default function App() {
  return (
    <Routes>

      {/* LOGIN */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* ====================== ADMIN ====================== */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="inicio" element={<DashboardAdminPage />} />
        <Route path="historial" element={<AccesoPage />} />
        <Route path="gestion" element={<PersonasPage />} />
        <Route path="personas" element={<PersonasPage />} />
        <Route path="vehiculos" element={<VehiculosPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="auditoria" element={<AuditoriaPage />} />
        <Route path="gestion_a" element={<GestionPage />} />
        <Route path="alertas" element={<AlertasPage />} />  
        <Route path="calendario" element={<CalendarioAdmin />} />

        {/* Default admin → /admin/inicio */}
        <Route index element={<Navigate to="inicio" replace />} />
      </Route>

      {/* ==================== VIGILANTE ==================== */}
      <Route path="/vigilante" element={<VigilanteLayout />}>
        <Route path="inicio" element={<DashboardVigilantePage />} />
        <Route path="historial" element={<AccesoPage />} />
        <Route path="gestion" element={<GestionVigilante />} />
        <Route path="vehiculos" element={<VehiculosPage />} />
        <Route path="personas" element={<PersonasPage />} />
        <Route path="calendario" element={<CalendarioVigilante />} />
        <Route path="vehiculos_dentro" element={<VehiculosDentro />} />

        {/* Default vigilante → /vigilante/inicio */}
        <Route index element={<Navigate to="inicio" replace />} />
      </Route>

      {/* ====================== 404 ======================= */}
      <Route
        path="*"
        element={
          <div className="flex h-screen w-screen flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-red-700">404</h1>
            <p className="text-gray-600">Página No Encontrada</p>
          </div>
        }
      />
    </Routes>
  )
}
