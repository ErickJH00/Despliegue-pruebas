import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import CustomTable from '../components/CustomTable.jsx';
import ModalForm from '../components/ModalForm.jsx';

// --- API Logic ---
const API_URL = 'http://127.0.0.1:5000/api';
const getToken = () => localStorage.getItem('token');

const getPersonas = async () => {
    const response = await axios.get(`${API_URL}/personas`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

const createPersona = async (data) => {
    const response = await axios.post(`${API_URL}/personas`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

const updatePersona = async (id, data) => {
    const response = await axios.put(`${API_URL}/personas/${id}`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

const deletePersona = async (id) => {
    const response = await axios.delete(`${API_URL}/personas/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// --- Formulario ---
const TIPO_PERSONA = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'VISITANTE'];

const PersonaForm = ({ formData, handleChange }) => (
  <div className="row g-3">
    <div className="col-md-6">
      <label htmlFor="doc_identidad" className="form-label">Documento de Identidad</label>
      <input
        type="text" id="doc_identidad" name="doc_identidad"
        value={formData.doc_identidad || ''} onChange={handleChange}
        required className="form-control"
      />
    </div>
    <div className="col-md-6">
      <label htmlFor="nombre" className="form-label">Nombre Completo</label>
      <input
        type="text" id="nombre" name="nombre"
        value={formData.nombre || ''} onChange={handleChange}
        required className="form-control"
      />
    </div>
    <div className="col-md-6">
      <label htmlFor="tipo_persona" className="form-label">Tipo de Persona</label>
      <select
        id="tipo_persona" name="tipo_persona"
        value={formData.tipo_persona || ''} onChange={handleChange}
        required className="form-select"
      >
        <option value="">Seleccione...</option>
        {TIPO_PERSONA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
      </select>
    </div>
    <div className="col-md-6">
      <label htmlFor="estado" className="form-label">Estado</label>
      <select
        id="estado" name="estado"
        value={formData.estado === 0 ? 0 : 1}
        onChange={handleChange}
        className="form-select"
      >
        <option value={1}>Activo</option>
        <option value={0}>Inactivo</option>
      </select>
    </div>
  </div>
);

// --- Componente Principal ---
const PersonasPage = () => {
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null); 
  const [formData, setFormData] = useState({}); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // --- Estados de Paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchPersonas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPersonas();
      setPersonas(data);
      setError(null);
    } catch (err) {
      console.error("Error cargando personas:", err);
      setError(err.response?.data?.error || err.message || "Error al cargar personas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const handleOpenModal = (persona = null) => {
    setEditingPersona(persona);
    setFormData(persona ? { ...persona, estado: persona.estado ?? 1 } : { estado: 1 });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPersona(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: name === 'estado' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (!formData.doc_identidad || !formData.nombre || !formData.tipo_persona) {
          throw new Error("Documento, Nombre y Tipo son obligatorios.");
      }
      if (editingPersona) {
        await updatePersona(editingPersona.id_persona, formData);
      } else {
        await createPersona(formData);
      }
      handleCloseModal();
      fetchPersonas();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (persona) => {
    const id_persona = persona.id_persona;
    if (window.confirm(`¿Estás seguro de que deseas desactivar a ${persona.nombre}?`)) {
      try {
        await deletePersona(id_persona);
        alert("Persona desactivada exitosamente");
        fetchPersonas();
      } catch (err) {
        console.error("Error al desactivar persona:", err);
        alert("Error al desactivar persona.");
      }
    }
  };
  
  // --- Filtrado y Paginación ---
  const filteredPersonas = personas.filter(p =>
    (p.doc_identidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPersonas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);

  // Columnas
  const columns = useMemo(() => [
    { Header: 'Documento', accessor: 'doc_identidad' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Tipo', accessor: 'tipo_persona' },
    { 
      Header: 'Estado', 
      accessor: 'estado',
      Cell: ({ value }) => (
        <span className={`badge ${value === 1 ? 'bg-success' : 'bg-secondary'}`}>
            {value === 1 ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ], []);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center pb-2 mb-4" 
           style={{ borderBottom: '3px solid #dc3545' }}>
        <h1 className="h2 mb-0" style={{color: '#3a3b45', fontWeight: 700}}>Gestión de Personas</h1>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text"><i className="fas fa-search"></i></span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por Documento o Nombre..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button onClick={() => handleOpenModal(null)} className="btn btn-danger" style={{fontWeight: 600}}>
          Agregar Persona
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-5">Cargando personas...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <CustomTable
              columns={columns}
              data={currentItems} // Usamos los items paginados
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          </div>
          {/* Controles de Paginación */}
          <div className="card-footer d-flex justify-content-between align-items-center">
             <span className="text-muted small">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredPersonas.length)} de {filteredPersonas.length} registros
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
        title={editingPersona ? 'Editar Persona' : 'Crear Nueva Persona'}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        error={error}
      >
        <PersonaForm formData={formData} handleChange={handleChange} />
      </ModalForm>
    </div>
  );
};
export default PersonasPage;