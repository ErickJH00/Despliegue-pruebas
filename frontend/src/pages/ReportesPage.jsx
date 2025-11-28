import React, { useState } from 'react';
import axios from 'axios';
// (Si usas FontAwesome, asegúrate de que esté configurado en tu proyecto)

// --- Lógica de API (sin cambios) ---
const getToken = () => {
    return localStorage.getItem('token');
};
const API_PDF_URL = 'http://127.0.0.1:5000/api/admin/exportar/pdf';
const API_EXCEL_URL = 'http://127.0.0.1:5000/api/admin/exportar/excel';

const descargarReporte = async (tipo) => {
    const token = getToken();
    if (!token) throw new Error('No se encontró token de autenticación');

    const url = tipo === 'pdf' ? API_PDF_URL : API_EXCEL_URL;
    const filename = tipo === 'pdf' ? 'reporte_vehiculos.pdf' : 'reporte_vehiculos.xlsx';

    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob',
        });
        const fileURL = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(fileURL);
    } catch (error) {
        console.error(`Error al descargar ${tipo}:`, error.response?.data || error.message);
        if (error.response?.data.type === "application/json") {
            const errText = await error.response.data.text();
            throw new Error(JSON.parse(errText).error || 'Error en el servidor');
        } else {
            throw new Error(`Error en el servidor al generar el ${tipo}`);
        }
    }
};

// --- Componente de la Página (Maquetación estilo Dashboard) ---

const ReportesPage = () => {
    const [loading, setLoading] = useState(null); // 'pdf', 'excel', o null
    const [error, setError] = useState(null);

    const handleDownload = async (tipo) => {
        try {
            setError(null);
            setLoading(tipo);
            await descargarReporte(tipo);
        } catch (err) {
            setError(err.message || 'No se pudo descargar el reporte');
        } finally {
            setLoading(null);
        }
    };

    // Estilo para los títulos de las tarjetas
    const cardTitleStyle = (color) => ({
        fontWeight: 'bold',
        color: color, 
        borderBottom: `2px solid ${color}`, 
        paddingBottom: '10px',
        display: 'inline-block', 
    });
    
    // Colores del dashboard
    const pdfColor = '#e74a3b'; // Rojo
    const excelColor = '#1cc88a'; // Verde

    // --- Manejo de Errores y Carga ---
    // NO MOSTRAMOS NADA SI HAY ERROR DE TOKEN (Excepto el error mismo)
    if (error && error.includes('token')) {
        return <div className="container p-4"><div className="alert alert-danger">Error: No se encontró token de autenticación. Por favor, inicie sesión.</div></div>;
    }

    return (
        <div className="container-fluid p-4">

            {/* 1. Título principal y subtítulo */}
            <div className="mb-4">
                <h1 className="h3 mb-1" style={{ color: '#8c1e29', fontWeight: 'bold' }}>
                    Generación de Reportes
                </h1>
                <p className="text-muted">
                    Descargue los listados completos del sistema en PDF o Excel.
                </p>
            </div>

            {/* 2. Fila con las Cajas Grandes */}
            <div className="row">

                {/* --- Caja Grande: Reporte PDF --- */}
                <div className="col-lg-6 mb-4">
                    <div className="card shadow h-100">
                        <div className="card-body text-center d-flex flex-column justify-content-between p-4">
                            
                            <h5 className="mb-4" style={cardTitleStyle(pdfColor)}>
                                Reporte PDF
                            </h5>
                            
                            <div className="my-3">
                                <i className="fas fa-file-pdf" style={{ fontSize: '100px', color: pdfColor }}></i>
                            </div>

                            <p className="text-muted">
                                Ideal para impresión y archivo digital. Formato estándar no editable.
                            </p>
                            
                            <button 
                                className="btn btn-danger btn-lg mt-3"
                                onClick={() => handleDownload('pdf')}
                                disabled={loading === 'pdf'}
                            >
                                {loading === 'pdf' ? 'Generando...' : 'Descargar PDF'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Caja Grande: Reporte Excel --- */}
                <div className="col-lg-6 mb-4">
                    <div className="card shadow h-100">
                        <div className="card-body text-center d-flex flex-column justify-content-between p-4">
                            
                            <h5 className="mb-4" style={cardTitleStyle(excelColor)}>
                                Reporte Excel
                            </h5>
                            
                            <div className="my-3">
                                <i className="fas fa-file-excel" style={{ fontSize: '100px', color: excelColor }}></i>
                            </div>

                            <p className="text-muted">
                                Ideal para analizar datos, filtrar y crear tablas dinámicas.
                            </p>

                            <button 
                                className="btn btn-success btn-lg mt-3"
                                onClick={() => handleDownload('excel')}
                                disabled={loading === 'excel'}
                            >
                                {loading === 'excel' ? 'Generando...' : 'Descargar Excel'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mensaje de Error (solo para errores de descarga) */}
            {error && !error.includes('token') && (
                <div className="alert alert-danger mt-3" role="alert">
                    <strong>Error:</strong> {error}
                </div>
            )}
            
        </div>
    );
};

export default ReportesPage;