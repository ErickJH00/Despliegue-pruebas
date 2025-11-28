import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CustomTable from '../components/CustomTable.jsx';

const API_URL = 'http://127.0.0.1:5000/api';

const VehiculosDentro = () => {
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del Modal de Reporte
  const [showModal, setShowModal] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [formReporte, setFormReporte] = useState({
    tipo: 'Mal Parqueado',
    detalle: '',
    severidad: 'media'
  });

  // Cargar vehículos adentro
  const fetchVehiculos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/vigilante/vehiculos-en-patio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehiculos(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehiculos(); }, []);

  // Manejador del botón Reportar
  const handleOpenReport = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setFormReporte({ tipo: 'Mal Parqueado', detalle: '', severidad: 'media' });
    setShowModal(true);
  };

  // Enviar Reporte
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formReporte,
        id_acceso: selectedVehiculo.id_acceso // Vinculamos al acceso de entrada
      };
      
      await axios.post(`${API_URL}/vigilante/reportar`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("✅ Incidente reportado y enviado al administrador.");
      setShowModal(false);
    } catch (err) {
      alert("Error al enviar el reporte.");
    }
  };

  // Filtrado
  const filteredData = vehiculos.filter(v => 
    v.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Columnas
  const columns = useMemo(() => [
    { Header: 'Placa', accessor: 'placa', Cell: ({ value }) => <span className="fw-bold">{value}</span> },
    { Header: 'Tipo', accessor: 'tipo' },
    { Header: 'Color', accessor: 'color' },
    { Header: 'Hora Entrada', accessor: 'hora_entrada', Cell: ({ value }) => new Date(value).toLocaleTimeString() },
    {
        Header: 'Acción',
        accessor: 'id_acceso',
        Cell: ({ row }) => (
            <button 
                className="btn btn-sm btn-outline-danger fw-bold"
                onClick={() => handleOpenReport(row)}
            >
                <i className="fas fa-exclamation-triangle me-1"></i> Reportar
            </button>
        )
    }
  ], []);

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
        <h1 className="h3 text-dark fw-bold">
            <i className="fas fa-parking me-2 text-primary"></i> 
            Vehículos en Patio
        </h1>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/vigilante/gestion')}>Volver</button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input 
            type="text" 
            className="form-control" 
            placeholder="Buscar placa..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla */}
      {loading ? <div className="text-center">Cargando...</div> : (
        <div className="card shadow-sm border-0">
            <div className="card-body p-0">
                <CustomTable columns={columns} data={filteredData} />
            </div>
        </div>
      )}

      {/* Modal de Reporte */}
      {showModal && selectedVehiculo && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">Reportar Incidente - {selectedVehiculo.placa}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                    </div>
                    <form onSubmit={handleSubmitReport}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Tipo de Incidente</label>
                                <select 
                                    className="form-select" 
                                    value={formReporte.tipo} 
                                    onChange={e => setFormReporte({...formReporte, tipo: e.target.value})}
                                >
                                    <option value="Mal Parqueado">Mal Parqueado</option>
                                    <option value="Pico y Placa">Pico y Placa</option>
                                    <option value="Choque Leve">Choque Leve</option>
                                    <option value="Obstrucción">Obstrucción de vía</option>
                                    <option value="Luces Encendidas">Luces Encendidas</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Severidad</label>
                                <div className="d-flex gap-3">
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" name="sev" value="baja" checked={formReporte.severidad === 'baja'} onChange={() => setFormReporte({...formReporte, severidad: 'baja'})} />
                                        <label className="form-check-label text-success">Baja</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" name="sev" value="media" checked={formReporte.severidad === 'media'} onChange={() => setFormReporte({...formReporte, severidad: 'media'})} />
                                        <label className="form-check-label text-warning">Media</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" name="sev" value="alta" checked={formReporte.severidad === 'alta'} onChange={() => setFormReporte({...formReporte, severidad: 'alta'})} />
                                        <label className="form-check-label text-danger">Alta</label>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Detalle / Observaciones</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    required
                                    value={formReporte.detalle}
                                    onChange={e => setFormReporte({...formReporte, detalle: e.target.value})}
                                    placeholder="Describa brevemente lo sucedido..."
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-danger fw-bold">Enviar Reporte</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VehiculosDentro;