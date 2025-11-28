import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const API_URL = 'http://127.0.0.1:5000/api';

const CalendarioVigilante = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/eventos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const parsedEvents = response.data.map(evt => ({
        ...evt,
        start: new Date(evt.start),
        end: new Date(evt.end),
      }));
      setEvents(parsedEvents);
      setFilteredEvents(parsedEvents);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Filtrado por búsqueda
  useEffect(() => {
    const results = events.filter(event =>
      event.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(results);
  }, [searchTerm, events]);

  const handleNavigate = (newDate) => setCurrentDate(newDate);
  const handleViewChange = (newView) => setCurrentView(newView);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleVerify = async () => {
    if (!selectedEvent) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/eventos/${selectedEvent.id_evento}/verificar`, 
        { verificado: true }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Evento marcado como verificado/en curso.");
      setShowModal(false);
      fetchEvents();
    } catch (err) { alert("Error al verificar evento"); }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#dc3545';
    if (event.categoria === 'Mantenimiento') backgroundColor = '#d63384';
    if (event.categoria === 'Institucional') backgroundColor = '#0d6efd';
    
    const style = { backgroundColor, borderRadius: '4px', border: 'none', color: 'white', fontSize: '0.85rem' };
    if (event.verificado) {
        style.border = "2px solid #00ff00";
        style.boxShadow = "0 0 5px #00ff00";
    }
    return { style };
  };

  const upcomingEvents = events.filter(e => e.start >= new Date()).sort((a, b) => a.start - b.start).slice(0, 3);

  return (
    // LAYOUT PRINCIPAL FULL SCREEN
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
      
      {/* Estilos Inyectados */}
      <style>{`
        .rbc-calendar { font-family: 'Poppins', sans-serif; }
        .rbc-header { padding: 10px 0; font-weight: 700; font-size: 1rem; background-color: #f8f9fa; color: #495057; text-transform: uppercase; }
        .rbc-month-view { border-radius: 12px; overflow: hidden; border: 1px solid #e3e6f0; box-shadow: 0 .15rem 1.75rem 0 rgba(58,59,69,.15); }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #e3e6f0; }
        .rbc-off-range-bg { background-color: #f8f9fc; }
        .rbc-date-cell { padding: 8px; font-weight: 600; font-size: 1rem; color: #5a5c69; }
        .rbc-today { background-color: #fff3cd; }
        .rbc-event { min-height: 25px; }
        .rbc-toolbar button { color: #5a5c69; font-weight: 600; border: 1px solid #d1d3e2; }
        .rbc-toolbar button:hover { background-color: #eaecf4; color: #2e59d9; }
        .rbc-toolbar button.rbc-active { background-color: #4e73df; color: white; box-shadow: none; border-color: #4e73df; }
      `}</style>

      {/* 1. HEADER */}
      <div className="bg-white shadow-sm border-bottom px-4 py-3 d-flex justify-content-between align-items-center" style={{ flexShrink: 0 }}>
        <h1 className="h4 mb-0 fw-bold text-dark">
            <i className="fas fa-calendar-check me-2 text-success"></i>
            Calendario Operativo
        </h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/vigilante/gestion')}>Volver</button>
      </div>

      {/* 2. CONTENEDOR DE CONTENIDO */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* A. SIDEBAR IZQUIERDO (Solo Lectura) */}
        <div className="bg-white border-end p-3 overflow-auto" style={{ width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Buscador */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small">BUSCAR</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="fas fa-search text-muted"></i></span>
                <input type="text" className="form-control bg-light border-start-0" placeholder="Título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* Lista Próximos (Sin botón de crear) */}
            <h6 className="fw-bold text-uppercase text-secondary small mb-3">Próximos Eventos</h6>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {upcomingEvents.length === 0 ? (
                    <div className="text-muted small fst-italic text-center py-3">Sin eventos próximos.</div>
                ) : (
                    upcomingEvents.map(evt => (
                    <div key={evt.id_evento} 
                        className="card text-white mb-3 shadow-sm border-0 cursor-pointer" 
                        style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)' }} 
                        onClick={() => handleSelectEvent(evt)}
                    >
                        <div className="card-body p-3">
                            <h6 className="fw-bold mb-0" style={{fontSize: '0.9rem'}}>
                                {evt.start instanceof Date ? format(evt.start, 'd MMM', { locale: es }).toUpperCase() : ''}
                            </h6>
                            <p className="small mb-0 text-white-50 text-truncate">{evt.titulo}</p>
                            <span className="badge bg-white text-danger mt-2">{evt.start instanceof Date ? format(evt.start, 'HH:mm') : ''}</span>
                        </div>
                    </div>
                    ))
                )}
            </div>
        </div>

        {/* B. ÁREA DEL CALENDARIO */}
        <div style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card shadow-sm border-0 h-100 w-100">
                <div className="card-body p-0 h-100">
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        date={currentDate}
                        view={currentView}
                        onNavigate={setCurrentDate}
                        onView={setCurrentView}
                        style={{ height: '100%', width: '100%' }}
                        messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día", agenda: "Agenda" }}
                        culture='es'
                        onSelectEvent={handleSelectEvent} // Solo seleccionar
                        eventPropGetter={eventStyleGetter}
                    />
                </div>
            </div>
        </div>

      </div>

      {/* --- MODAL DE DETALLES (SOLO LECTURA) --- */}
      {showModal && selectedEvent && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
              <div className="modal-header bg-dark text-white py-2">
                <h5 className="modal-title fs-6 fw-bold">{selectedEvent.titulo}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between mb-3">
                    <span className="badge bg-secondary">{selectedEvent.categoria}</span>
                    {selectedEvent.verificado ? (
                        <span className="badge bg-success">✅ Verificado</span>
                    ) : (
                        <span className="badge bg-warning text-dark">⚠️ Pendiente</span>
                    )}
                </div>
                
                <div className="mb-3">
                    <strong className="d-block text-secondary small mb-1">UBICACIÓN</strong>
                    <p className="mb-0 fw-bold">{selectedEvent.ubicacion || 'No especificada'}</p>
                </div>

                <div className="row mb-3">
                    <div className="col-6">
                        <strong className="d-block text-secondary small mb-1">INICIO</strong>
                        <p className="mb-0">{selectedEvent.start.toLocaleString()}</p>
                    </div>
                    <div className="col-6">
                        <strong className="d-block text-secondary small mb-1">FIN</strong>
                        <p className="mb-0">{selectedEvent.end.toLocaleString()}</p>
                    </div>
                </div>
                
                <div className="bg-light p-3 rounded border">
                    <strong className="d-block text-secondary small mb-1">DESCRIPCIÓN</strong>
                    <p className="mb-0 text-muted">{selectedEvent.descripcion || 'Sin descripción adicional.'}</p>
                </div>
              </div>
              
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                {!selectedEvent.verificado && (
                    <button type="button" className="btn btn-sm btn-success fw-bold" onClick={handleVerify}>
                        <i className="fas fa-check me-2"></i> Confirmar Inicio
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioVigilante;