import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CustomTable from '../components/CustomTable.jsx';

const API_URL = 'http://127.0.0.1:5000/api';

const AlertasPage = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Cargar Datos ---
  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Nota: Esta ruta ya debe existir en tu server.py
      const response = await axios.get(`${API_URL}/admin/alertas`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setAlertas(response.data);
    } catch (err) {
      console.error("Error cargando alertas:", err);
      setError("No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  // --- Acción Resolver (Eliminar) ---
  const handleResolver = async (alerta) => {
    if (window.confirm("¿Marcar esta alerta como resuelta? Desaparecerá de la lista.")) {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/alertas/${alerta.id_alerta}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Recargamos la lista
            fetchAlertas();
        } catch (err) {
            alert("Error al resolver la alerta.");
        }
    }
  };

  // --- Definición de Columnas ---
  const columns = useMemo(() => [
    { Header: 'Fecha/Hora', accessor: 'fecha_hora' },
    { 
        Header: 'Tipo de Incidente', 
        accessor: 'tipo',
        Cell: ({ value }) => <span className="fw-bold text-dark">{value}</span>
    },
    { Header: 'Detalle', accessor: 'detalle' },
    { 
        Header: 'Severidad', 
        accessor: 'severidad',
        Cell: ({ value }) => {
            // Asignar colores según severidad
            let badgeClass = 'bg-secondary';
            const val = value ? value.toLowerCase() : '';
            if (val === 'alta' || val === 'critica') badgeClass = 'bg-danger';
            if (val === 'media') badgeClass = 'bg-warning text-dark';
            if (val === 'baja') badgeClass = 'bg-info text-dark';
            
            return (
                <span className={`badge ${badgeClass} px-2 py-1`}>
                    {value ? value.toUpperCase() : 'N/A'}
                </span>
            );
        }
    },
    { Header: 'Vigilante', accessor: 'nombre_vigilante' },
    {
        Header: 'Acciones',
        accessor: 'actions',
        Cell: ({ row }) => (
            <button 
                className="btn btn-success btn-sm" 
                onClick={() => handleResolver(row)}
                title="Marcar como resuelta"
            >
                <i className="fas fa-check"></i> Resolver
            </button>
        )
    }
  ], []);

  return (
    <div className="container-fluid p-4">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center pb-2 mb-4 border-bottom">
        <h1 className="h2 text-gray-800">
            <i className="fas fa-bell text-warning me-2"></i>
            Centro de Alertas
        </h1>
      </div>

      {/* Mensajes de estado */}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Cargando alertas...</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0">
            <div className="card-body p-0">
                <CustomTable columns={columns} data={alertas} />
            </div>
            {alertas.length === 0 && (
                <div className="p-5 text-center text-muted">
                    <i className="fas fa-check-circle fa-3x mb-3 text-success opacity-50"></i>
                    <h4>Todo en orden</h4>
                    <p>No hay alertas de seguridad activas en este momento.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AlertasPage;