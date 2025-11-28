// frontend/src/components/ModalForm.jsx
import React from 'react';

/**
 * Componente de "cáscara" para un modal.
 *
 * Props:
 * - isOpen: (boolean) Controla si el modal está visible o no.
 * - onClose: Función para cerrar el modal (ej. al pulsar la 'X' o el fondo).
 * - title: El título que se mostrará en la cabecera del modal.
 * - children: El contenido del modal (normalmente el <form>).
 * - onSubmit: Función que se llama al pulsar el botón "Guardar".
 * - submitText: (opcional) Texto del botón de envío (default: "Guardar").
 * - isLoading: (opcional) boolean para deshabilitar botones mientras se guarda.
 */
function ModalForm({ isOpen, onClose, title, children, onSubmit, submitText = "Guardar", isLoading = false }) {
  if (!isOpen) {
    return null; // No renderizar nada si está cerrado
  }

  // Maneja el clic en el fondo para cerrar
  const handleBackdropClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && !isLoading) {
      onSubmit(e);
    }
  };

  return (
    // Fondo oscuro (overlay)
    <div
      id="modal-overlay"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60"
    >
      {/* Contenedor del modal */}
      <div className="relative z-50 w-full max-w-lg rounded-lg bg-white shadow-xl">
        
        {/* Envolvemos todo en el formulario */}
        <form onSubmit={handleSubmit}>
          
          {/* Cabecera del Modal */}
          <div className="flex items-start justify-between rounded-t border-b p-4">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              onClick={onClose}
              disabled={isLoading}
            >
              {/* Icono de 'X' */}
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>

          {/* Cuerpo del Modal (el formulario que pasamos como children) */}
          <div className="p-6">
            {children}
          </div>

          {/* Pie del Modal (Botones) */}
          <div className="flex items-center justify-end space-x-2 rounded-b border-t border-gray-200 p-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : submitText}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}

export default ModalForm;