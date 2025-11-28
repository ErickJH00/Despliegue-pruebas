import axios from 'axios';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const API_URL = 'http://127.0.0.1:5000/api';

const CalendarioAdmin = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id_evento: null, title: '', descripcion: '', start: '', end: '', ubicacion: '', categoria: 'Mantenimiento'
  });

  const fetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/eventos`, { headers: { Authorization: `Bearer ${token}` } });
      const parsedEvents = response.data.map(evt => ({ ...evt, start: new Date(evt.start), end: new Date(evt.end) }));
      setEvents(parsedEvents);
      setFilteredEvents(parsedEvents);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    const results = events.filter(event =>
      event.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(results);
  }, [searchTerm, events]);

  const handleSelectSlot = ({ start, end }) => {
    setFormData({ id_evento: null, title: '', descripcion: '', start: start.toISOString().slice(0, 16), end: end.toISOString().slice(0, 16), ubicacion: '', categoria: 'Mantenimiento' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    setFormData({
      id_evento: event.id_evento, title: event.titulo, descripcion: event.descripcion,
      start: new Date(event.start).toISOString().slice(0, 16),
      end: new Date(event.end).toISOString().slice(0, 16),
      ubicacion: event.ubicacion, categoria: event.categoria
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const endpoint = isEditing ? `${API_URL}/eventos/${formData.id_evento}` : `${API_URL}/eventos`;
    const method = isEditing ? 'put' : 'post';
    try {
      await axios[method](endpoint, { ...formData, titulo: formData.title }, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false);
      fetchEvents();
    } catch (err) { alert("Error al guardar"); }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Eliminar evento?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/eventos/${formData.id_evento}`, { headers: { Authorization: `Bearer ${token}` } });
        setShowModal(false);
        fetchEvents();
      } catch (err) { alert("Error al eliminar"); }
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#dc3545';
    if (event.categoria === 'Mantenimiento') backgroundColor = '#d63384';
    if (event.categoria === 'Institucional') backgroundColor = '#0d6efd';
    return { style: { backgroundColor, borderRadius: '4px', border: 'none', color: 'white', fontSize: '0.85rem' } };
  };

  const upcomingEvents = events.filter(e => e.start >= new Date()).sort((a, b) => a.start - b.start).slice(0, 3);

  return (
    // LAYOUT PRINCIPAL: Ocupa toda la pantalla (100vw, 100vh) y usa Flexbox
    <div style={{ height: '100vh', width: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
      
      {/* 1. HEADER SUPERIOR */}
      <div className="bg-white shadow-sm border-bottom px-4 py-3 d-flex justify-content-between align-items-center" style={{ flexShrink: 0 }}>
        <h1 className="h4 mb-0 fw-bold text-dark">Gestión de Eventos</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/admin/gestion_a')}>Volver</button>
      </div>

      {/* 2. CONTENEDOR DE CONTENIDO (Sidebar + Calendario) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* A. SIDEBAR IZQUIERDO (Ancho fijo 320px) */}
        <div className="bg-white border-end p-3 overflow-auto" style={{ width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Buscador */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small">BUSCAR</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="fas fa-search text-muted"></i></span>
                <input type="text" className="form-control bg-light border-start-0" placeholder="Título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* Botón Nuevo */}
            <button className="btn btn-danger w-100 py-2 mb-4 fw-bold shadow-sm" onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })}>
                <i className="fas fa-plus me-2"></i> Nuevo Evento
            </button>

            {/* Lista Próximos */}
            <h6 className="fw-bold text-uppercase text-secondary small mb-3">Próximos Eventos</h6>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {upcomingEvents.length === 0 ? (
                    <div className="text-muted small fst-italic text-center py-3">Sin eventos próximos.</div>
                ) : (
                    upcomingEvents.map(evt => (
                    <div key={evt.id_evento} className="card text-white mb-3 shadow-sm border-0 cursor-pointer" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)' }} onClick={() => handleSelectEvent(evt)}>
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

        {/* B. ÁREA DEL CALENDARIO (Toma todo el espacio restante) */}
        <div style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card shadow-sm border-0 h-100 w-100">
                <div className="card-body p-0 h-100">
                    {/* El calendario ocupa el 100% de ancho y alto de su contenedor padre */}
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
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                    />
                </div>
            </div>
        </div>

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white py-2">
                <h5 className="modal-title fs-6 fw-bold">{isEditing ? 'Editar' : 'Nuevo'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-3">
                  <input className="form-control mb-2 fw-bold" placeholder="Título" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value, titulo: e.target.value})} />
                  <div className="row g-2 mb-2">
                    <div className="col-6"><input type="datetime-local" className="form-control form-control-sm" required value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} /></div>
                    <div className="col-6"><input type="datetime-local" className="form-control form-control-sm" required value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} /></div>
                  </div>
                  <select className="form-select form-select-sm mb-2" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Evento Masivo">Evento Masivo</option>
                        <option value="Institucional">Institucional</option>
                  </select>
                  <input className="form-control form-control-sm mb-2" placeholder="Ubicación" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} />
                  <textarea className="form-control form-control-sm" rows="2" placeholder="Descripción..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                </div>
                <div className="modal-footer bg-light py-1">
                  {isEditing && <button type="button" className="btn btn-sm btn-outline-danger me-auto" onClick={handleDelete}>Eliminar</button>}
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-sm btn-danger">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioAdmin;