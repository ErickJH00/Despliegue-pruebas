from core.db.connection import get_connection
from psycopg2.extras import RealDictCursor

def obtener_alertas_controller():
    """
    Obtiene todas las alertas activas (Vista Admin).
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                al.id_alerta,
                al.tipo,
                al.detalle,
                al.severidad,
                TO_CHAR(acc.fecha_hora, 'YYYY-MM-DD HH12:MI AM') as fecha_hora,
                v.nombre as nombre_vigilante
            FROM alerta al
            LEFT JOIN acceso acc ON al.id_acceso = acc.id_acceso
            LEFT JOIN tmusuarios v ON al.id_vigilante = v.nu
            ORDER BY acc.fecha_hora DESC;
        """
        cursor.execute(query)
        return cursor.fetchall()
    except Exception as e:
        print(f"Error obteniendo alertas: {e}")
        return []
    finally:
        if conn: conn.close()

def obtener_mis_reportes_controller(id_vigilante):
    """
    Obtiene solo las alertas creadas por un vigilante específico.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Seleccionamos alertas y si tienen acceso asociado, traemos la fecha.
        # Si es novedad general (id_acceso NULL), usamos una fecha aproximada o de creación si existiera
        # (Como alerta no tiene fecha propia, dependemos del acceso. Para generales, quedará sin fecha o NULL)
        query = """
            SELECT 
                al.id_alerta,
                al.tipo,
                al.detalle,
                al.severidad,
                TO_CHAR(acc.fecha_hora, 'YYYY-MM-DD HH12:MI AM') as fecha_hora
            FROM alerta al
            LEFT JOIN acceso acc ON al.id_acceso = acc.id_acceso
            WHERE al.id_vigilante = %s
            ORDER BY al.id_alerta DESC;
        """
        cursor.execute(query, (id_vigilante,))
        return cursor.fetchall()
    except Exception as e:
        print(f"Error obteniendo mis reportes: {e}")
        return []
    finally:
        if conn: conn.close()

def eliminar_alerta_controller(id_alerta):
    """
    Elimina una alerta de la base de datos (Acción 'Resolver').
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM alerta WHERE id_alerta = %s", (id_alerta,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error eliminando alerta: {e}")
        return False
    finally:
        if conn: conn.close()