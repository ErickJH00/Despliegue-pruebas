from core.db.connection import get_connection

# ✅ 1. Obtener los últimos 7 accesos registrados
def obtener_ultimos_accesos():
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.fecha_hora,
                    v.placa,
                    a.resultado,
                    g.nombre AS vigilante
                FROM acceso a
                INNER JOIN vehiculo v ON a.id_vehiculo = v.id_vehiculo
                INNER JOIN vigilante g ON a.id_vigilante = g.id_vigilante
                ORDER BY a.fecha_hora DESC
                LIMIT 7;
            """)
            accesos = cursor.fetchall()
            return [
                {
                    "fecha_hora": str(row[0]),
                    "placa": row[1],
                    "resultado": row[2],
                    "vigilante": row[3]
                }
                for row in accesos
            ]
    except Exception as ex:
        print(f"❌ Error en obtener_ultimos_accesos: {ex}")
        return []
    finally:
        if connection:
            connection.close()

# ✅ 2. Contar total de vehículos registrados
def contar_total_vehiculos():
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM vehiculo;")
            total = cursor.fetchone()[0]
            return {"total": total}
    except Exception as ex:
        print(f"❌ Error en contar_total_vehiculos: {ex}")
        return {"total": 0}
    finally:
        if connection:
            connection.close()

# ✅ 3. Contar total de alertas activas
def contar_alertas_activas():
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM alerta;")
            total = cursor.fetchone()[0]
            return {"total": total}
    except Exception as ex:
        print(f"❌ Error en contar_alertas_activas: {ex}")
        return {"total": 0}
    finally:
        if connection:
            connection.close()

# ✅ 4. Buscar un vehículo por su placa
def buscar_placa_bd(placa):
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    v.placa,
                    v.tipo,
                    v.color,
                    p.nombre AS propietario
                FROM vehiculo v
                INNER JOIN persona p ON v.id_persona = p.id_persona
                WHERE v.placa ILIKE %s;
            """, (placa,))
            result = cursor.fetchone()
            if result:
                return {
                    "placa": result[0],
                    "tipo": result[1],
                    "color": result[2],
                    "propietario": result[3]
                }
            else:
                return None
    except Exception as ex:
        print(f"❌ Error en buscar_placa_bd: {ex}")
        return None
    finally:
        if connection:
            connection.close()
