import React from 'react';
import { Link } from 'react-router-dom';

const GestionVigilante = () => {
  
  // Definición de las tarjetas para el VIGILANTE
  const modules = [
    {
      title: "Vehículos",
      desc: "Consultar y gestionar el ingreso de vehículos.",
      icon: "fas fa-car",
      link: "/vigilante/vehiculos", // Ruta actualizada
      color: "primary" // Azul
    },
    {
      title: "Personas",
      desc: "Consultar información de propietarios y usuarios.",
      icon: "fas fa-users",
      link: "/vigilante/personas", // Ruta actualizada
      color: "info" // Cian
    },
    {
      title: "Calendario",
      desc: "Ver eventos y actividades programadas.",
      icon: "fas fa-calendar-day",
      link: "/vigilante/calendario", // Se creará más adelante
      color: "warning" // Amarillo (Visualización)
    },
    {
      title: "Reportar Incidente",
      desc: "Registrar novedades, fallos o situaciones inusuales.",
      icon: "fas fa-clipboard-list", // Icono de reporte
      link: "/vigilante/vehiculos_dentro", // Se creó la página VehiculosDentro
      color: "danger" // Rojo (Importante)
    }
  ];

  return (
    <div className="container-fluid p-4">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center pb-2 mb-4 border-bottom">
        <h1 className="h2 text-gray-800">Gestión Operativa</h1>
        <Link to="/vigilante/inicio" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i> Volver al Inicio
        </Link>
      </div>

      {/* Rejilla de Tarjetas */}
      <div className="row g-4">
        {modules.map((mod, index) => (
          <div key={index} className="col-md-6 col-lg-6"> {/* 2 columnas en pantallas grandes para que se vean grandes */}
            <div className="card shadow-sm h-100 border-0 hover-scale">
              <div className="card-body text-center p-5">
                
                {/* Icono Circular */}
                <div className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-${mod.color} bg-opacity-10 text-${mod.color}`} style={{ width: '80px', height: '80px' }}>
                  <i className={`${mod.icon} fa-3x`}></i>
                </div>

                <h3 className="card-title h5 fw-bold mb-2">{mod.title}</h3>
                <p className="card-text text-muted mb-4">{mod.desc}</p>
                
                <Link to={mod.link} className={`btn btn-outline-${mod.color} w-100 fw-bold`}>
                  Acceder
                </Link>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estilo extra para efecto hover */}
      <style jsx="true">{`
        .hover-scale { transition: transform 0.2s ease-in-out; }
        .hover-scale:hover { transform: translateY(-5px); }
      `}</style>
    </div>
  );
};

export default GestionVigilante;