import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Importamos los estilos del módulo (usaremos las clases como 'tarjeta')
import styles from '../pages/DashboardVigilantePage.module.css';

// Definimos la URL de la API (como en las otras páginas)
const API_URL = 'http://127.0.0.1:5000/api';

// --- Definición de tipos para los datos ---
interface IAcceso {
  fecha_hora: string;
  placa: string;
  resultado: string;
  vigilante: string;
}

// Nota: No necesitamos el hook useAuth ni Navbar aquí porque el Layout se encarga.

const DashboardVigilantePage: React.FC = () => {
  const navigate = useNavigate();

  // --- Estados de React para manejar los datos ---
  const [ultimosAccesos, setUltimosAccesos] = useState<IAcceso[]>([]);
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [alertasActivas, setAlertasActivas] = useState("0 alertas");
  const [placaInput, setPlacaInput] = useState('');
  
  const getToken = () => localStorage.getItem("token");


  // --- Lógica de Carga de Datos (Usando Axios) ---
  const cargarUltimosAccesos = useCallback(async (token: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/ultimos_accesos`, config);
      setUltimosAccesos(res.data);
    } catch (err) {
      console.error("❌ Error al cargar accesos:", err);
    }
  }, []);

  const cargarTotalVehiculos = useCallback(async (token: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/total_vehiculos`, config);
      setTotalVehiculos(res.data.total);
    } catch (err) {
      console.error("❌ Error al cargar total de vehículos:", err);
    }
  }, []);

  const cargarAlertasActivas = useCallback(async (token: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/alertas_activas`, config);
      setAlertasActivas(`${res.data.total} alertas activas`);
    } catch (err) {
      console.error("❌ Error al cargar alertas activas:", err);
    }
  }, []);

  // Efecto para cargar todos los datos cuando el componente se monta
  useEffect(() => {
    const token = getToken();
    if (token) {
        cargarUltimosAccesos(token);
        cargarTotalVehiculos(token);
        cargarAlertasActivas(token);
    }
  }, [cargarUltimosAccesos, cargarTotalVehiculos, cargarAlertasActivas]);


  // --- Lógica de Búsqueda de Placa ---
  const handleBuscarPlaca = async () => {
    if (!placaInput) {
      alert("Por favor ingresa una placa.");
      return;
    }
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/buscar_placa/${placaInput}`, config);
      const data = res.data;
      
      alert(
        `✅ Vehículo encontrado:\nPlaca: ${data.placa}\nTipo: ${data.tipo}\nColor: ${data.color}\nPropietario: ${data.propietario}`
      );
    } catch (err) {
      console.error("Error al buscar placa:", err);
      alert("❌ Placa no encontrada o error de conexión");
    }
  };


  // --- JSX (SOLO CONTENIDO, SIN BARRA DE NAVEGACIÓN) ---
  return (
    // Reutilizamos el mainContent del CSS que está diseñado para la rejilla
    <main className={styles.mainContent}> 
        {/* Validar acceso */}
        <section className={`${styles.tarjeta} ${styles.rojo}`}>
          <h2>Validar acceso vehicular</h2>
          <input 
            type="text" 
            id="buscarPlaca" 
            placeholder="Buscar placa..." 
            value={placaInput}
            onChange={(e) => setPlacaInput(e.target.value)}
          />
          <button id="btnBuscar" onClick={handleBuscarPlaca}>Verificar</button>
        </section>

        {/* Historial */}
        <section className={styles.tarjeta}>
          <h2>Historial de Accesos</h2>
          <table id="tablaAccesos">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Placa</th>
                <th>Resultado</th>
                <th>Vigilante</th>
              </tr>
            </thead>
            <tbody>
              {ultimosAccesos.length === 0 ? (
                <tr><td colSpan={4}>No hay registros</td></tr>
              ) : (
                ultimosAccesos.map((a, index) => (
                  <tr key={index}>
                    <td>{a.fecha_hora}</td>
                    <td>{a.placa}</td>
                    <td>{a.resultado}</td>
                    <td>{a.vigilante}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Alertas */}
        <section className={`${styles.tarjeta} ${styles.alerta}`}>
          <h2>Alertas Activas</h2>
          <p id="alertasActivas">{alertasActivas}</p>
          <Link to="#" className={styles.navLink}><button disabled>Gestionar alertas</button></Link>
        </section>

        {/* Gestión */}
        <section className={styles.tarjeta}>
          <h2>Gestión de Vehículos</h2>
          <p>Total registrados: <span id="totalVehiculos">{totalVehiculos}</span></p>
          <Link to="/vigilante/vehiculos" className={styles.navLink}><button>Ver Vehículos</button></Link>
        </section>
      </main>
  );
};

export default DashboardVigilantePage;