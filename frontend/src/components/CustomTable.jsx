import React from 'react';

/**
 * Helper para acceder a propiedades anidadas de forma segura.
 * Ej: getNestedValue(item, 'propietario.nombre') -> "Juan Perez"
 */
const getNestedValue = (obj, path) => {
  if (!path) return null;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const CustomTable = ({ columns, data, onEdit, onDelete }) => {
  // Si no hay datos, mostramos un mensaje amigable
  if (!data || data.length === 0) {
    return (
      <div className="p-5 text-center text-muted bg-white rounded shadow-sm border">
        <i className="fas fa-inbox fa-3x mb-3 opacity-50"></i>
        <p className="mb-0">No hay datos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive rounded shadow-sm border bg-white">
      <table className="table table-hover mb-0 align-middle">
        <thead className="bg-light">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                scope="col" 
                className="px-4 py-3 text-secondary text-uppercase small fw-bold border-bottom"
                style={{ minWidth: '100px' }}
              >
                {col.Header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th scope="col" className="px-4 py-3 text-secondary text-uppercase small fw-bold border-bottom text-center" style={{ width: '150px' }}>
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => {
                // 1. Obtenemos el valor base
                const cellValue = getNestedValue(item, col.accessor);
                
                return (
                  <td key={colIndex} className="px-4 py-3 text-sm border-bottom-0">
                    {/* 2. Si hay render personalizado (Cell), úsalo. Si no, muestra el valor. */}
                    {col.Cell ? (
                      col.Cell({ value: cellValue, row: item })
                    ) : (
                      cellValue || <span className="text-muted fst-italic">N/A</span>
                    )}
                  </td>
                );
              })}
              
              {/* Botones de Acción */}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-center border-bottom-0">
                  <div className="d-flex justify-content-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                        <span className="d-none d-md-inline">Editar</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash-alt"></i>
                        <span className="d-none d-md-inline">Eliminar</span>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomTable;