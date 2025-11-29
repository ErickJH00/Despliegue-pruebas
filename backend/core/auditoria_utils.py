# backend/core/auditoria_utils.py
# backend/core/auditoria_utils.py
import json
from core.db.connection import get_connection

def registrar_auditoria_global(id_usuario, entidad, id_entidad, accion, datos_previos=None, datos_nuevos=None):
    """
    Registra un evento en la auditoría usando CURRENT_TIMESTAMP.
    Seguro, liviano y compatible con el pool de conexiones.
    """
    if not id_usuario:
        return

    try:
        conn = get_connection()
        if conn is None:
            print("❌ No se pudo obtener conexión para auditoría")
            return

        with conn:
            with conn.cursor() as cur:
                query = """
                    INSERT INTO auditoria (id_usuario, entidad, id_entidad, accion, datos_previos, datos_nuevos, fecha_hora)
                    VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                """

                val_ant = json.dumps(datos_previos, default=str) if datos_previos else None
                val_nue = json.dumps(datos_nuevos, default=str) if datos_nuevos else None

                cur.execute(query, (
                    id_usuario, entidad, id_entidad, accion,
                    val_ant, val_nue
                ))

    except Exception as e:
        print(f"❌ Error guardando auditoría: {e}")

