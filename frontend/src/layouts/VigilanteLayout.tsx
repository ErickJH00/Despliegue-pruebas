import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import styles from './VigilanteLayout.module.css';

interface IUserInfo {
  nombre?: string;
  rol?: string;
}

const VigilanteLayout: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<IUserInfo>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

    if (!token || storedUserInfo.rol !== "Vigilante") {
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
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <img src="/img/SmartCar.png" alt="SmartCar Logo" className={styles.logo}/>
        </div>
        <div className={styles.navRight}>
          <NavLink to="/vigilante/inicio" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            🏠 Inicio
          </NavLink>

          <NavLink to="/vigilante/historial" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            📝 Historial
          </NavLink>

          <NavLink to="/vigilante/gestion" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            ⚙️ Gestión
          </NavLink>

          <span className={styles.usuarioLogueado}>👤 {userInfo.nombre}</span>
          <button className={styles.btnLogout} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default VigilanteLayout;
