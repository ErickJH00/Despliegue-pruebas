# backend/core/controller_calendario.py
from core.db.connection import get_connection
from psycopg2.extras import RealDictCursor
from core.auditoria_utils import registrar_auditoria_global

def obtener_eventos_controller():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT 
                id_evento,
                titulo,
                descripcion,
                TO_CHAR(fecha_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') as start,
                TO_CHAR(fecha_fin, 'YYYY-MM-DD"T"HH24:MI:SS') as end,
                ubicacion,
                categoria,
                verificado,
                id_creador
            FROM evento
            ORDER BY fecha_inicio DESC;
        """
        cursor.execute(query)
        return cursor.fetchall()
    except Exception as e:
        print(f"Error obteniendo eventos: {e}")
        return []
    finally:
        if conn: conn.close()

def hay_evento_activo_controller():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        query = "SELECT COUNT(*) FROM evento WHERE NOW() BETWEEN fecha_inicio AND fecha_fin"
        cur.execute(query)
        cantidad = cur.fetchone()[0]
        return cantidad > 0
    except Exception as e:
        print(f"Error verificando eventos activos: {e}")
        return False
    finally:
        if conn: conn.close()

def crear_evento_controller(data, usuario_actual):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        id_creador = usuario_actual.get('id_audit')
        query = """
            INSERT INTO evento (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, categoria, id_creador)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id_evento
        """
        cursor.execute(query, (
            data.get('titulo'),
            data.get('descripcion'),
            data.get('start'),
            data.get('end'),
            data.get('ubicacion'),
            data.get('categoria'),
            id_creador
        ))
        id_nuevo = cursor.fetchone()[0]
        conn.commit()
        registrar_auditoria_global(
            id_usuario=id_creador,
            entidad="EVENTO",
            id_entidad=id_nuevo,
            accion="CREAR_EVENTO",
            datos_nuevos=data
        )
        return id_nuevo
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error creando evento: {e}")
        raise e
    finally:
        if conn: conn.close()

def actualizar_evento_controller(id_evento, data, usuario_actual=None):
    conn = None
    try:
        conn = get_connection()
        cur_lectura = conn.cursor(cursor_factory=RealDictCursor)
        cur_lectura.execute("SELECT * FROM evento WHERE id_evento = %s", (id_evento,))
        evento_anterior = cur_lectura.fetchone()
        cur_lectura.close()

        cursor = conn.cursor()
        query = """
            UPDATE evento
            SET titulo = %s, descripcion = %s, fecha_inicio = %s, fecha_fin = %s, ubicacion = %s, categoria = %s
            WHERE id_evento = %s
        """
        cursor.execute(query, (
            data.get('titulo'),
            data.get('descripcion'),
            data.get('start'),
            data.get('end'),
            data.get('ubicacion'),
            data.get('categoria'),
            id_evento
        ))
        conn.commit()

        # Auditoría
        if usuario_actual and evento_anterior:
            for campo in ['fecha_inicio','fecha_fin']:
                if evento_anterior.get(campo):
                    evento_anterior[campo] = str(evento_anterior[campo])
            registrar_auditoria_global(
                id_usuario=usuario_actual.get('id_audit'),
                entidad="EVENTO",
                id_entidad=id_evento,
                accion="ACTUALIZAR_EVENTO",
                datos_previos=evento_anterior,
                datos_nuevos=data
            )
        return True
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error actualizando evento: {e}")
        raise e
    finally:
        if conn: conn.close()

def eliminar_evento_controller(id_evento, usuario_actual):
    conn = None
    try:
        conn = get_connection()
        cur_lectura = conn.cursor(cursor_factory=RealDictCursor)
        cur_lectura.execute("SELECT * FROM evento WHERE id_evento = %s", (id_evento,))
        evento_anterior = cur_lectura.fetchone()
        cur_lectura.close()

        if not evento_anterior:
            return False

        cursor = conn.cursor()
        cursor.execute("DELETE FROM evento WHERE id_evento = %s", (id_evento,))
        conn.commit()

        for campo in ['fecha_inicio','fecha_fin']:
            if evento_anterior.get(campo):
                evento_anterior[campo] = str(evento_anterior[campo])

        id_usuario = usuario_actual.get('id_audit') if usuario_actual else None
        registrar_auditoria_global(
            id_usuario=id_usuario,
            entidad="EVENTO",
            id_entidad=id_evento,
            accion="ELIMINAR_EVENTO",
            datos_previos=evento_anterior
        )
        return True
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error eliminando evento: {e}")
        raise e
    finally:
        if conn: conn.close()

def verificar_evento_controller(id_evento, estado_verificacion, usuario_actual=None):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = "UPDATE evento SET verificado = %s WHERE id_evento = %s"
        cursor.execute(query, (estado_verificacion, id_evento))
        conn.commit()

        # Auditoría
        if usuario_actual:
            registrar_auditoria_global(
                id_usuario=usuario_actual.get('id_audit'),
                entidad="EVENTO",
                id_entidad=id_evento,
                accion="VERIFICAR_EVENTO",
                datos_nuevos={"verificado": estado_verificacion}
            )
        return True
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error verificando evento: {e}")
        raise e
    finally:
        if conn: conn.close()

