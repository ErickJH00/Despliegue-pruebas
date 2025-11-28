import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import CustomTable from '../components/CustomTable.jsx';
import ModalForm from '../components/ModalForm.jsx';

// --- API Logic ---
const API_URL = 'http://127.0.0.1:5000/api';
const getToken = () => localStorage.getItem('token');

const getVehiculos = async () => {
    const response = await axios.get(`${API_URL}/vehiculos`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

const createVehiculo = async (data) => {
    const response = await axios.post(`${API_URL}/vehiculos`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

const updateVehiculo = async (id, data) => {
    const response = await axios.put(`${API_URL}/vehiculos/${id}`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

const deleteVehiculo = async (id) => {
    const response = await axios.delete(`${API_URL}/vehiculos/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// --- Formulario ---
const TIPO_VEHICULO = ['Automovil', 'Motocicleta', 'Bicicleta'];

const VehiculoForm = ({ formData, handleChange }) => (
  <div className="row g-3">
    <div className="col-md-6">
      <label htmlFor="placa" className="form-label">Placa</label>
      <input
        type="text" id="placa" name="placa"
        value={formData.placa || ''} onChange={handleChange}
        required className="form-control"
      />
    </div>
    <div className="col-md-6">
      <label htmlFor="id_persona" className="form-label">ID del Propietario</label>
      <input
        type="number" id="id_persona" name="id_persona"
        value={formData.id_persona || ''} onChange={handleChange}
        required min="1" className="form-control"
      />
    </div>
    <div className="col-md-6">
      <label htmlFor="tipo" className="form-label">Tipo de Vehículo</label>
      <select
        id="tipo" name="tipo"
        value={formData.tipo || ''} onChange={handleChange}
        required className="form-select"
      >
        <option value="">Seleccione...</option>
        {TIPO_VEHICULO.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
      </select>
    </div>
    <div className="col-md-6">
      <label htmlFor="color" className="form-label">Color</label>
      <input
        type="text" id="color" name="color"
        value={formData.color || ''} onChange={handleChange}
        className="form-control"
      />
    </div>
  </div>
);

// --- Componente Principal ---
const VehiculosPage = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null); 
  const [formData, setFormData] = useState({}); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // --- Estados de Paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchVehiculos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getVehiculos();
      setVehiculos(data);
      setError(null);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      setError(err.response?.data?.error || err.message || "Error al cargar vehículos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

  const handleOpenModal = (vehiculo = null) => {
    setEditingVehiculo(vehiculo);
    setFormData(vehiculo ? { ...vehiculo, id_persona: vehiculo.id_persona } : {});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehiculo(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (!formData.placa || !formData.id_persona || !formData.tipo) {
          throw new Error("Placa, ID Propietario y Tipo son obligatorios.");
      }
      const dataToSend = { ...formData, id_persona: parseInt(formData.id_persona, 10) };

      if (editingVehiculo) {
        await updateVehiculo(editingVehiculo.id_vehiculo, dataToSend);
      } else {
        await createVehiculo(dataToSend);
      }
      handleCloseModal();
      fetchVehiculos();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (vehiculo) => {
    const id_vehiculo = vehiculo.id_vehiculo;
    if (window.confirm(`¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE el vehículo ${vehiculo.placa}?`)) {
      try {
        await deleteVehiculo(id_vehiculo);
        alert("Vehículo eliminado exitosamente");
        fetchVehiculos();
      } catch (err) {
        console.error("Error al eliminar vehículo:", err);
        alert("Error al eliminar vehículo.");
      }
    }
  };
  
  // --- Filtrado y Paginación ---
  const filteredVehiculos = vehiculos.filter(v =>
    v.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVehiculos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage);

  const columns = useMemo(() => [
    { Header: 'Placa', accessor: 'placa' },
    { Header: 'Tipo', accessor: 'tipo' },
    { Header: 'Color', accessor: 'color' },
    { Header: 'Nombre Propietario', accessor: 'propietario.nombre' },
  ], []);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center pb-2 mb-4" 
           style={{ borderBottom: '3px solid #dc3545' }}>
        <h1 className="h2 mb-0" style={{color: '#3a3b45', fontWeight: 700}}>Gestión de Vehículos</h1>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text"><i className="fas fa-search"></i></span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por placa..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button onClick={() => handleOpenModal(null)} className="btn btn-danger" style={{fontWeight: 600}}>
          Agregar Vehículo
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-5">Cargando vehículos...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <CustomTable
              columns={columns}
              data={currentItems} // Items paginados
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          </div>
          {/* Controles de Paginación */}
          <div className="card-footer d-flex justify-content-between align-items-center">
             <span className="text-muted small">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredVehiculos.length)} de {filteredVehiculos.length} registros
             </span>
             <div>
                <button 
                    className="btn btn-outline-secondary btn-sm me-2" 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Anterior
                </button>
                <span className="mx-2">Página {currentPage} de {totalPages || 1}</span>
                <button 
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Siguiente
                </button>
             </div>
          </div>
        </div>
      )}

      <ModalForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVehiculo ? 'Editar Vehículo' : 'Crear Nuevo Vehículo'}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        error={error}
      >
        <VehiculoForm formData={formData} handleChange={handleChange} />
      </ModalForm>
    </div>
  );
};
export default VehiculosPage;