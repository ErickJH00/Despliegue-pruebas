from backend.core.db.connection import get_connection

def obtener_datos_dashboard():
    """Resumen de datos generales para administrador"""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM vehiculo;")
        total_vehiculos = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM acceso;")
        total_accesos = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM alerta;")
        total_alertas = cur.fetchone()[0]

        cur.close()
        conn.close()

        return {
            "total_vehiculos": total_vehiculos,
            "total_accesos": total_accesos,
            "total_alertas": total_alertas
        }

    except Exception as e:
        print("❌ Error en obtener_datos_dashboard:", e)
        return {}


def obtener_accesos_detalle():
    """Lista todos los accesos con datos del vehículo y propietario"""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                v.placa,
                v.tipo,
                v.color,
                p.nombre AS propietario,
                a.resultado
            FROM acceso a
            JOIN vehiculo v ON a.id_vehiculo = v.id_vehiculo
            JOIN persona p ON v.id_persona = p.id_persona
            ORDER BY a.id_acceso ASC;
        """)
        data = cur.fetchall()
        cur.close()
        conn.close()

        return [
            {
                "placa": r[0],
                "tipo": r[1],
                "color": r[2],
                "propietario": r[3],
                "resultado": r[4]
            } for r in data
        ]
    except Exception as e:
        print("❌ Error en obtener_accesos_detalle:", e)
        return []


def registrar_vigilante(nombre, doc, telefono, id_rol):
    """Registrar nuevo vigilante"""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO vigilante (nombre, doc_identidad, telefono, id_rol, estado)
            VALUES (%s, %s, %s, %s, 1)
        """, (nombre, doc, telefono, id_rol))
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print("❌ Error en registrar_vigilante:", e)
        return False
