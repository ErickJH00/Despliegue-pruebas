from core.db.connection import get_connection
from psycopg2.extras import RealDictCursor
from datetime import date
from core.auditoria_utils import registrar_auditoria_global

def obtener_vehiculos_en_patio():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT DISTINCT ON (v.placa)
                v.placa,
                v.tipo,
                v.color,
                p.nombre as propietario,
                a.fecha_hora as hora_entrada,
                a.id_acceso,
                pc.tipo as ultima_accion
            FROM acceso a
            JOIN vehiculo v ON a.id_vehiculo = v.id_vehiculo
            JOIN persona p ON v.id_persona = p.id_persona
            JOIN punto_de_control pc ON a.id_punto = pc.id_punto
            -- WHERE DATE(a.fecha_hora) = CURRENT_DATE 
            ORDER BY v.placa, a.fecha_hora DESC
        """
        cursor.execute(query)
        todos_los_movimientos = cursor.fetchall()
        vehiculos_adentro = [
            veh for veh in todos_los_movimientos 
            if 'Entrada' in veh['ultima_accion'] or 'entrada' in veh['ultima_accion']
        ]
        return vehiculos_adentro
    except Exception as e:
        print(f"Error obteniendo vehículos en patio: {e}")
        return []
    finally:
        if conn: conn.close()

def crear_incidente_manual(data, id_vigilante_actual):
    return _insertar_alerta(data, id_vigilante_actual, data.get('id_acceso'))

def crear_novedad_general(data, id_vigilante_actual):
    return _insertar_alerta(data, id_vigilante_actual, None)

def _insertar_alerta(data, id_vigilante, id_acceso):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO alerta (tipo, detalle, severidad, id_acceso, id_vigilante)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id_alerta
        """
        cursor.execute(query, (
            data.get('tipo'),
            data.get('detalle'),
            data.get('severidad'),
            id_acceso,
            id_vigilante
        ))
        id_nueva_alerta = cursor.fetchone()[0]
        conn.commit()

        # Auditoría
        registrar_auditoria_global(
            id_usuario=id_vigilante,
            entidad="ALERTA",
            id_entidad=id_nueva_alerta,
            accion="CREAR_ALERTA",
            datos_nuevos=data
        )

        return True
    except Exception as e:
        print(f"Error creando reporte: {e}")
        return False
    finally:
        if conn: conn.close()
