import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

// --- CAMBIO CLAVE AQUÍ ---
// Importamos los estilos avanzados del Dashboard Vigilante
import styles from './AdminLayout.module.css'
interface IUserInfo {
  nombre?: string;
  rol?: string;
}

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<IUserInfo>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

    if (!token || storedUserInfo.rol !== "Administrador") {
      navigate("/login"); 
      return;
    }
    setUserInfo(storedUserInfo);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_info");
    navigate("/login");
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Usamos las clases del CSS del Vigilante para la Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <Link to="/admin/inicio">
            <img
              src="/img/SmartCar.png"
              alt="SmartCar logo showing a stylized car icon next to the word SmartCar, serving as a clickable link to the admin dashboard; conveys a professional, trustworthy tone and a focus on vehicle monitoring in a clean app interface"
              className={styles.logo}
            />
          </Link>
        </div>
        <div className={styles.navRight}>
          <NavLink to="/admin/inicio" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            🏠 Inicio
          </NavLink>

          <NavLink to="/admin/historial" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            📝 Historial
          </NavLink>

          <NavLink to="/admin/gestion_a" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            ⚙️ Gestión
          </NavLink>

          <NavLink to="/admin/auditoria" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            🛡️ Auditoría
          </NavLink>

          <span className={styles.usuarioLogueado}>👤 {userInfo.nombre}</span>
          <button className={styles.btnLogout} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      {/* AÑADIMOS mainContent AQUÍ para el fondo y la rejilla */}
      <main className={styles.mainContent}> 
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;