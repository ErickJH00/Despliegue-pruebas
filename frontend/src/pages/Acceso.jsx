import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

// --- ICONOS SVG ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Accesos() {
  const [showModal, setShowModal] = useState(false);
  
  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleType, setVehicleType] = useState(''); // Nuevo Estado
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar historial con filtros
  const fetchHistorial = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir parámetros de URL
      const params = new URLSearchParams();
      if (searchTerm) params.append('placa', searchTerm);
      if (vehicleType) params.append('tipo', vehicleType);
      if (dateFrom) params.append('desde', dateFrom);
      if (dateTo) params.append('hasta', dateTo);

      const response = await axios.get(`http://127.0.0.1:5000/api/accesos?${params.toString()}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setHistorial(response.data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, vehicleType, dateFrom, dateTo]); // Dependencias: se ejecuta al cambiar estos

  // Efecto inicial y al cambiar filtros
  useEffect(() => {
    // Usamos un pequeño timeout (debounce) para no saturar si escriben rápido
    const delayDebounceFn = setTimeout(() => {
      fetchHistorial();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchHistorial]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Historial de Accesos</h1>
          <p className="text-gray-600">Visualiza y gestiona el ingreso vehicular.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-red-800 transition-all active:scale-95"
        >
          <CameraIcon />
          Validar Nuevo Acceso
        </button>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* 1. Buscar Placa */}
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-gray-700 block mb-1">Buscar placa</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Ej: ABC-123"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Tipo de Vehículo (NUEVO) */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de Vehículo</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 outline-none bg-white"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="Automovil">Automóvil</option>
            <option value="Motocicleta">Motocicleta</option>
            <option value="Camioneta">Camioneta</option>
            <option value="Bicicleta">Bicicleta</option>
          </select>
        </div>

        {/* 3. Desde */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Desde</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 outline-none" 
            value={dateFrom} 
            onChange={e => setDateFrom(e.target.value)} 
          />
        </div>

        {/* 4. Hasta */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Hasta</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 outline-none" 
            value={dateTo} 
            onChange={e => setDateTo(e.target.value)} 
          />
        </div>
      </div>

      {/* --- TABLA DE DATOS --- */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Placa</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entrada</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salida</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="6" className="text-center py-4">Cargando datos...</td></tr>
              ) : historial.length === 0 ? (
                 <tr><td colSpan="6" className="text-center py-4 text-gray-500">No se encontraron registros.</td></tr>
              ) : (
                historial.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{item.placa}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{item.tipo}</td>
                    <td className="px-6 py-4 text-gray-500">{item.entrada}</td>
                    <td className="px-6 py-4 text-gray-500">{item.salida}</td>
                    <td className="px-6 py-4 text-gray-500">{item.fecha}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (item.estado && item.estado.includes('Concedido')) || item.estado === 'Permitido' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-red-700 p-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <CameraIcon /> Validar Acceso
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:bg-red-600 rounded-full p-1 transition-colors">
                <XIcon />
              </button>
            </div>
            <div className="p-6">
              <ValidationComponentInternal 
                apiUrl="http://127.0.0.1:5000/api/accesos/validar" 
                onClose={() => setShowModal(false)}
                onRefresh={fetchHistorial} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ... EL COMPONENTE ValidationComponentInternal SE MANTIENE IGUAL QUE EN MI RESPUESTA ANTERIOR ...
// (Asegúrate de copiarlo del archivo anterior si lo necesitas, pero no ha cambiado)
// -------------------------------------------------------------------------------------------
// SOLO PARA QUE EL ARCHIVO ESTÉ COMPLETO, PEGO AQUÍ EL FINAL DE ValidationComponentInternal
// -------------------------------------------------------------------------------------------

function ValidationComponentInternal({ apiUrl, onClose, onRefresh }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [accessType, setAccessType] = useState('entrada');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResult(null);
      setPreviewUrl(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => setBase64Image(reader.result);
    }
  };

  const handleValidate = async () => {
    if (!base64Image) return;
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64Image, tipo_acceso: accessType })
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      if (data.resultado === 'Autorizado') {
        setResult({ type: 'success', title: '¡ACCESO AUTORIZADO!', placa: data.datos.placa, propietario: data.datos.propietario });
        if(onRefresh) onRefresh();
      } else {
        setResult({ type: 'error', title: `¡ACCESO DENEGADO!`, placa: data.datos.placa || 'No detectada', propietario: data.datos.motivo });
      }
    } catch (error) {
      setResult({ type: 'error', title: 'Error de Conexión', placa: '...', propietario: 'Revisa consola.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg">
        <button onClick={() => setAccessType('entrada')} className={`py-2 text-sm font-bold rounded-md transition-all ${accessType === 'entrada' ? 'bg-white text-red-700 shadow-sm border' : 'text-gray-500'}`}>ENTRADA</button>
        <button onClick={() => setAccessType('salida')} className={`py-2 text-sm font-bold rounded-md transition-all ${accessType === 'salida' ? 'bg-white text-red-700 shadow-sm border' : 'text-gray-500'}`}>SALIDA</button>
      </div>
      <div className="relative group">
        {!previewUrl ? (
          <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-red-50 transition-all">
             <span className="text-sm font-medium text-gray-600">Toca para subir foto</span>
             <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
          </label>
        ) : (
          <div className="relative h-48 rounded-xl overflow-hidden shadow-md">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={() => { setPreviewUrl(null); setResult(null); setBase64Image(null); }} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full"><XIcon className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <button onClick={handleValidate} disabled={!previewUrl || isLoading} className={`w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center transition-all ${!previewUrl || isLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}>
        {isLoading ? 'Procesando...' : `Validar ${accessType.toUpperCase()}`}
      </button>
      {result && (
        <div className={`p-4 rounded-xl border-l-4 animate-fade-in ${result.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <h4 className={`font-extrabold ${result.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{result.title}</h4>
          <p className="text-sm mt-1">Placa: <b>{result.placa}</b> <br/> {result.propietario}</p>
        </div>
      )}
    </div>
  );
}