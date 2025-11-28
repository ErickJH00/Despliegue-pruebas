import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CustomTable from '../components/CustomTable.jsx';

// Helper para formatear el JSON en el Modal
const formatData = (data) => {
    if (!data) return <span className="text-muted fst-italic">N/A</span>;
    try {
        const obj = typeof data === 'string' ? JSON.parse(data) : data;
        return (
            <pre className="bg-light p-3 rounded border" style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(obj, null, 2)}
            </pre>
        );
    } catch (e) {
        return <span className="text-break">{String(data)}</span>;
    }
};

const API_URL = 'http://127.0.0.1:5000/api/admin/auditoria';

const AuditoriaPage = () => {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- ESTADOS DE FILTRO Y PAGINACIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // --- ESTADOS DEL MODAL ---
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // 1. Cargar Datos
    const fetchAuditoria = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistorial(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error cargando historial');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditoria();
    }, []);

    // 2. Lógica de Filtrado (Texto y Fechas)
    const filteredHistorial = useMemo(() => {
        return historial.filter(item => {
            // Filtro de Texto
            const term = searchTerm.toLowerCase();
            const matchesText = 
                item.nombre_vigilante?.toLowerCase().includes(term) ||
                item.accion?.toLowerCase().includes(term) ||
                item.entidad?.toLowerCase().includes(term);
            
            // Filtro de Fechas
            let matchesDate = true;
            const itemDate = new Date(item.fecha_hora);
            if (startDate) {
                matchesDate = matchesDate && itemDate >= new Date(startDate);
            }
            if (endDate) {
                // Ajustamos endDate para que incluya todo el día (hasta las 23:59:59)
                const end = new Date(endDate);
                end.setHours(23, 59, 59);
                matchesDate = matchesDate && itemDate <= end;
            }

            return matchesText && matchesDate;
        });
    }, [historial, searchTerm, startDate, endDate]);

    // 3. Lógica de Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistorial.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);

    // Manejador del Modal
    const handleViewDetails = (record) => {
        setSelectedRecord(record);
        setShowModal(true);
    };

    // 4. Definición de Columnas
    const columns = useMemo(() => [
        { 
            Header: 'Fecha y Hora', 
            accessor: 'fecha_hora',
            Cell: ({ value }) => <span className="text-nowrap small">{new Date(value).toLocaleString()}</span>
        },
        { 
            Header: 'Usuario', 
            accessor: 'nombre_vigilante',
            Cell: ({ value }) => <span className="fw-bold text-dark small">{value || 'Sistema'}</span>
        },
        { 
            Header: 'Acción', 
            accessor: 'accion',
            Cell: ({ value }) => {
                let color = 'secondary';
                if (value === 'CREAR') color = 'success';
                if (value === 'ACTUALIZAR') color = 'primary';
                if (value === 'ELIMINAR' || value === 'DESACTIVAR') color = 'danger';
                return <span className={`badge bg-${color}`}>{value}</span>;
            }
        },
        { 
            Header: 'Entidad', 
            accessor: 'entidad',
            Cell: ({ value, row }) => (
                <span className="small">
                    {value.toUpperCase()} <span className="text-muted">(ID: {row.id_entidad})</span>
                </span>
            )
        },
        {
            Header: 'Detalles',
            accessor: 'id_auditoria', // Usamos ID para que nunca sea null/undefined
            Cell: ({ row }) => (
                <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => handleViewDetails(row)}
                    title="Ver cambios JSON"
                >
                    <i className="fas fa-eye"></i> Ver
                </button>
            )
        }
    ], []);

    return (
        <div className="container-fluid p-4">
            {/* Encabezado */}
            <div className="d-flex justify-content-between align-items-center pb-2 mb-4 border-bottom">
                <h1 className="h2 text-gray-800">
                    <i className="fas fa-shield-alt text-primary me-2"></i>
                    Historial de Auditoría
                </h1>
            </div>

            {/* Barra de Filtros */}
            <div className="card shadow-sm border-0 mb-4 bg-light">
                <div className="card-body py-3">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label small fw-bold text-secondary">BUSCAR</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white"><i className="fas fa-search text-muted"></i></span>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Usuario, acción o entidad..."
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">DESDE</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={startDate} 
                                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }} 
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">HASTA</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={endDate} 
                                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }} 
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button 
                                className="btn btn-outline-secondary w-100"
                                onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Cargando registros de seguridad...</p>
                </div>
            ) : (
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0">
                        <CustomTable columns={columns} data={currentItems} />
                    </div>
                    
                    {/* Footer de Paginación */}
                    <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                        <span className="text-muted small">
                            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredHistorial.length)} de {filteredHistorial.length} registros
                        </span>
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>
                                        Anterior
                                    </button>
                                </li>
                                <li className="page-item disabled">
                                    <span className="page-link text-dark">
                                        Página {currentPage} de {totalPages || 1}
                                    </span>
                                </li>
                                <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>
                                        Siguiente
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            {/* --- MODAL DE DETALLES --- */}
            {showModal && selectedRecord && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">
                                    Detalle de Auditoría #{selectedRecord.id_auditoria}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body bg-light">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <strong className="text-secondary small">USUARIO RESPONSABLE</strong>
                                        <p className="fw-bold mb-0">{selectedRecord.nombre_vigilante}</p>
                                    </div>
                                    <div className="col-md-6 text-md-end">
                                        <strong className="text-secondary small">FECHA DEL EVENTO</strong>
                                        <p className="fw-bold mb-0">{new Date(selectedRecord.fecha_hora).toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div className="row g-3">
                                    {/* Columna Datos Previos */}
                                    <div className="col-md-6">
                                        <div className="card h-100 border-danger border-top-0 border-end-0 border-bottom-0 border-3 shadow-sm">
                                            <div className="card-body">
                                                <h6 className="card-title text-danger fw-bold border-bottom pb-2 mb-3">
                                                    <i className="fas fa-history me-2"></i>
                                                    Datos Previos
                                                </h6>
                                                {formatData(selectedRecord.datos_previos)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Datos Nuevos */}
                                    <div className="col-md-6">
                                        <div className="card h-100 border-success border-top-0 border-end-0 border-bottom-0 border-3 shadow-sm">
                                            <div className="card-body">
                                                <h6 className="card-title text-success fw-bold border-bottom pb-2 mb-3">
                                                    <i className="fas fa-save me-2"></i>
                                                    Datos Nuevos
                                                </h6>
                                                {formatData(selectedRecord.datos_nuevos)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditoriaPage;