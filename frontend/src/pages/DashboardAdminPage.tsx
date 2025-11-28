import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Importamos los estilos del módulo para las clases como 'tarjeta'
import styles from '../pages/DashboardVigilantePage.module.css';

// Definimos la URL de la API (como en las otras páginas)
const API_URL = 'http://127.0.0.1:5000/api';

// --- Definición de tipos para los datos ---
interface IResumen {
  total_vehiculos: number;
  total_accesos: number;
  total_alertas: number;
}
interface IAcceso {
  placa: string;
  tipo: string;
  color: string;
  propietario: string;
  resultado: string;
}

const DashboardAdminPage: React.FC = () => {
  // --- Estados para los datos del dashboard ---
  const [resumen, setResumen] = useState<IResumen>({ total_vehiculos: 0, total_accesos: 0, total_alertas: 0 });
  const [accesos, setAccesos] = useState<IAcceso[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // --- Estados para el formulario de registro de vigilante ---
  const [nombreVigilante, setNombreVigilante] = useState('');
  const [docVigilante, setDocVigilante] = useState('');
  const [telefonoVigilante, setTelefonoVigilante] = useState('');
  const [rolVigilante, setRolVigilante] = useState('1'); 
  const [errorVigilante, setErrorVigilante] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  // --- Lógica de Carga de Datos del Dashboard (Usando Axios) ---
  const cargarDatosDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const resResumen = await axios.get(`${API_URL}/admin/resumen`, config);
      setResumen(resResumen.data);

      const resAccesos = await axios.get(`${API_URL}/admin/accesos`, config);
      setAccesos(resAccesos.data);

    } catch (err) {
      console.error("❌ Error al cargar datos del dashboard:", err);
    } finally {
        setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosDashboard();
  }, [cargarDatosDashboard]);


  // --- Lógica de Registro de Vigilante ---
  const handleRegistrarVigilante = async () => {
    const data = {
      nombre: nombreVigilante,
      doc_identidad: docVigilante,
      telefono: telefonoVigilante,
      id_rol: parseInt(rolVigilante, 10)
    };
    
    if (!data.nombre || !data.doc_identidad) {
      setErrorVigilante("Nombre y Documento son obligatorios.");
      return;
    }
    setErrorVigilante(null);

    try {
      const token = getToken();
      await axios.post(`${API_URL}/admin/registrar_vigilante`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Vigilante registrado correctamente");
      setNombreVigilante('');
      setDocVigilante('');
      setTelefonoVigilante('');
    } catch (err) {
      const errorMessage = (err as any).response?.data?.error || "Error al registrar vigilante";
      setErrorVigilante("❌ " + errorMessage);
      console.error(err);
    }
  };


  // --- JSX (SOLO CONTENIDO, SIN BARRA DE NAVEGACIÓN) ---
  if (loadingDashboard) {
      return <div className={styles.mainContent}><p>Cargando datos del administrador...</p></div>;
  }

  return (
    <div className={styles.mainContent}> 
        
        {/* === FILA SUPERIOR: RESUMEN Y REGISTRO (Dos Columnas) === */}

        {/* 1. Resumen General */}
        <section className={`${styles.tarjeta} col-span-1 p-4`}>
          <h2 className="text-xl font-bold mb-3 text-gray-700">Resumen General</h2>
          <p className="text-lg mb-1">Total Vehículos: <span className="font-bold">{resumen.total_vehiculos}</span></p>
          <p className="text-lg mb-1">Total Accesos: <span className="font-bold">{resumen.total_accesos}</span></p>
          <p className="text-lg mb-1">Total Alertas: <span className="font-bold">{resumen.total_alertas}</span></p>
        </section>

        {/* 2. Registrar Vigilante */}
        <section className={`${styles.tarjeta} col-span-1 p-4`}>
          <h2 className="text-xl font-bold mb-4 text-gray-700">Registrar Vigilante</h2>
          
          <div className="mb-2">
            <input 
              placeholder="Nombre completo" 
              value={nombreVigilante} 
              onChange={e => setNombreVigilante(e.target.value)} 
              className="form-control"
            />
          </div>
          <div className="mb-2">
            <input 
              placeholder="Documento" 
              value={docVigilante} 
              onChange={e => setDocVigilante(e.target.value)} 
              className="form-control"
            />
          </div>
          <div className="mb-3">
            <input 
              placeholder="Teléfono" 
              value={telefonoVigilante} 
              onChange={e => setTelefonoVigilante(e.target.value)} 
              className="form-control"
            />
          </div>
          
          <div className="d-flex align-items-center justify-content-between">
            <select 
              value={rolVigilante} 
              onChange={e => setRolVigilante(e.target.value)} 
              className="form-select me-3"
              style={{ width: '150px' }}
            >
              <option value="1">Principal</option>
              <option value="0">Vigilante</option>
            </select>
            <button 
              onClick={handleRegistrarVigilante} 
              className="btn btn-danger" 
              style={{ background: '#c00' }} /* Usar color de botón */
            >
              Registrar
            </button>
          </div>
          
          {errorVigilante && <div className="alert alert-danger mt-3">{errorVigilante}</div>}
        </section>

        {/* === FILA INFERIOR: HISTORIAL DE ACCESOS === */}

        {/* 3. Historial de Accesos (Ocupa dos columnas) */}
        <section className={`${styles.tarjeta} col-span-2 p-4`}>
          <h2 className="text-xl font-bold mb-4 text-gray-700">Historial de Accesos Recientes</h2>
          <div className="overflow-x-auto">
          <table id="tablaAccesos" className="table table-striped table-sm">
            <thead className="table-light">
              <tr style={{ fontWeight: 'bold' }}> {/* Aplicar bold al header */}
                <th>Placa</th>
                <th>Tipo</th>
                <th>Color</th>
                <th>Propietario</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {accesos.length === 0 ? (
                <tr><td colSpan={5} className="text-center">No hay accesos recientes</td></tr>
              ) : (
                accesos.slice(0, 5).map((a, index) => (
                  <tr key={index}>
                    <td>{a.placa}</td>
                    <td>{a.tipo}</td>
                    <td>{a.color}</td>
                    <td>{a.propietario}</td>
                    <td>{a.resultado}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          <Link to="/admin/historial" className="btn btn-link float-end">Ver Historial Completo</Link>
        </section>
    </div>
  );
};

export default DashboardAdminPage;