import React from 'react';
import { Link } from 'react-router-dom';

const GestionPage = () => {
  
  // Definición de las tarjetas del menú
  const modules = [
    {
      title: "Vehículos",
      desc: "Administrar la flota de vehículos registrados.",
      icon: "fas fa-car",
      link: "/admin/vehiculos",
      color: "primary" // Azul
    },
    {
      title: "Personas",
      desc: "Gestionar propietarios, estudiantes y docentes.",
      icon: "fas fa-users",
      link: "/admin/personas",
      color: "info" // Cian
    },
    {
      title: "Alertas",
      desc: "Revisar y gestionar incidentes de seguridad.",
      icon: "fas fa-exclamation-triangle",
      link: "/admin/alertas", // Crearemos esta ruta en la Fase 4
      color: "warning" // Amarillo
    },
    {
      title: "Reportes",
      desc: "Generar informes detallados en PDF y Excel.",
      icon: "fas fa-file-alt",
      link: "/admin/reportes",
      color: "success" // Verde
    },
    {
      title: "Calendario",
      desc: "Programar eventos y restricciones de acceso.",
      icon: "fas fa-calendar-alt",
      link: "/admin/calendario", // Crearemos esta ruta en la Fase 4
      color: "danger" // Rojo
    },
    {
      title: "Vigilantes",
      desc: "Administrar el personal de seguridad.",
      icon: "fas fa-user-shield",
      link: "#", // Pendiente de definir si tendrá vista propia
      color: "secondary" // Gris
    }
  ];

  return (
    <div className="container-fluid p-4">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center pb-2 mb-4 border-bottom">
        <h1 className="h2 text-gray-800">Panel de Gestión</h1>
        <span className="text-muted">Seleccione un módulo para administrar</span>
      </div>

      {/* Rejilla de Tarjetas */}
      <div className="row g-4">
        {modules.map((mod, index) => (
          <div key={index} className="col-md-6 col-lg-4">
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

      {/* Estilo extra para efecto hover (opcional) */}
      <style jsx="true">{`
        .hover-scale { transition: transform 0.2s ease-in-out; }
        .hover-scale:hover { transform: translateY(-5px); }
      `}</style>
    </div>
  );
};

export default GestionPage;