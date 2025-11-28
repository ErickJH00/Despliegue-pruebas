# backend/core/controller_vehiculos.py
# Lógica de negocio para el CRUD de Vehiculos (Alineado con bd_carros.sql)

import json
from backend.models.vehiculo import Vehiculo # CORREGIDO: Importación de modelo
from core.db.connection import get_connection
from psycopg2.extras import RealDictCursor # IMPORTANTE: Para cursores de diccionario en Psycopg2

# Importamos la función de auditoría
from core.controller_personas import _registrar_auditoria 
from backend.core.auditoria_utils import registrar_auditoria_global

# --- Funciones del CRUD de Vehiculos (Corregido) ---

def obtener_vehiculos_controller():
    """
    Obtiene todos los vehículos, incluyendo datos del propietario.
    """
    conn = None
    cursor = None
    try:
        # CORREGIDO: Llamada a la función correcta
        conn = get_connection() 
        # CORREGIDO: Sintaxis de cursor para Psycopg2
        cursor = conn.cursor(cursor_factory=RealDictCursor) 
        
        query = """
        SELECT 
            v.id_vehiculo, v.placa, v.tipo, v.color, v.id_persona,
            p.nombre AS propietario_nombre, 
            p.doc_identidad AS propietario_doc_identidad
        FROM vehiculo v
        JOIN persona p ON v.id_persona = p.id_persona
        WHERE p.estado = 1; 
        """
        cursor.execute(query)
        vehiculos_db = cursor.fetchall()
        
        vehiculos_lista = []
        for v in vehiculos_db:
            vehiculo_data = {
                "id_vehiculo": v['id_vehiculo'],
                "placa": v['placa'],
                "tipo": v['tipo'],
                "color": v['color'],
                "id_persona": v['id_persona'],
                "propietario": {
                    "id_persona": v['id_persona'],
                    "nombre": v['propietario_nombre'],
                    "doc_identidad": v['propietario_doc_identidad']
                }
            }
            vehiculos_lista.append(vehiculo_data)

        return vehiculos_lista
        
    except Exception as e:
        print(f"Error en obtener_vehiculos_controller: {e}")
        raise Exception(f"Error interno al obtener vehículos: {str(e)}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# CORREGIDO: La función ahora recibe 'usuario_actual' (del token) en lugar de 'headers'
def crear_vehiculo_controller(data, usuario_actual):
    """
    Crea un nuevo vehículo.
    """
    conn = None
    cursor = None
    try:
        nuevo_vehiculo = Vehiculo.from_dict(data)
        
        # CORREGIDO: Obtenemos el ID de auditoría del token (como lo definimos en el Paso 1)
        id_vigilante_actual = usuario_actual['id_audit']
        if not id_vigilante_actual:
            raise ValueError("Token inválido o ID de auditoría ausente")

        conn = get_connection() # CORREGIDO: Llamada a la función
        cursor = conn.cursor()
        
        # 1. Verificar si id_persona (propietario) existe
        cursor.execute("SELECT id_persona FROM persona WHERE id_persona = %s AND estado = 1", (nuevo_vehiculo.id_persona,))
        if not cursor.fetchone():
            raise ValueError(f"La Persona (propietario) con ID {nuevo_vehiculo.id_persona} no existe o está inactiva.")
            
        # 2. Insertar Vehiculo
        query = """
        INSERT INTO vehiculo (placa, tipo, color, id_persona)
        VALUES (%s, %s, %s, %s)
        RETURNING id_vehiculo -- CORREGIDO: Sintaxis de Psycopg2 para obtener ID
        """
        cursor.execute(query, (
            nuevo_vehiculo.placa,
            nuevo_vehiculo.tipo,
            nuevo_vehiculo.color,
            nuevo_vehiculo.id_persona
        ))
        
        # CORREGIDO: Obtenemos el ID devuelto
        id_vehiculo_nuevo = cursor.fetchone()[0]
        conn.commit()
        
        # 3. Registrar Auditoría
        nuevo_vehiculo.id_vehiculo = id_vehiculo_nuevo
        _registrar_auditoria(
            id_vigilante=id_vigilante_actual,
            entidad='vehiculo',
            id_entidad=id_vehiculo_nuevo,
            accion='CREAR',
            datos_previos=None,
            # Guardamos como string JSON en el campo TEXT
            datos_nuevos=json.dumps(nuevo_vehiculo.to_dict(), default=str) 
        )
        
        return id_vehiculo_nuevo

    except Exception as e:
        if conn: conn.rollback()
        print(f"Error en crear_vehiculo_controller: {e}")
        # Devolvemos el error específico de la BD (ej. "placa ya existe")
        raise Exception(f"Error interno al crear vehículo: {str(e)}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# CORREGIDO: La función ahora recibe 'usuario_actual'
def actualizar_vehiculo_controller(id_vehiculo, data, usuario_actual):
    """
    Actualiza un vehículo existente.
    """
    conn = None
    cursor = None
    cursor_dict = None
    try:
        # CORREGIDO: Obtenemos el ID de auditoría del token
        id_vigilante_actual = usuario_actual['id_audit']
        if not id_vigilante_actual:
            raise ValueError("Token inválido o ID de auditoría ausente")

        conn = get_connection() # CORREGIDO: Llamada a la función
        
        # 1. Obtener estado ANTERIOR (para Auditoría)
        # Usamos un cursor de diccionario solo para esta lectura
        cursor_dict = conn.cursor(cursor_factory=RealDictCursor)
        cursor_dict.execute("SELECT * FROM vehiculo WHERE id_vehiculo = %s", (id_vehiculo,))
        vehiculo_anterior_db = cursor_dict.fetchone()
        cursor_dict.close() # Cerramos este cursor
        
        if not vehiculo_anterior_db:
            raise ValueError("Vehiculo no encontrado")
        
        vehiculo_anterior = Vehiculo(**vehiculo_anterior_db)
        
        # 2. Iniciar transacción con cursor estándar
        cursor = conn.cursor()
        vehiculo_actualizado = Vehiculo.from_dict(data)
        vehiculo_actualizado.id_vehiculo = id_vehiculo 

        # 3. Verificar propietario
        cursor.execute("SELECT id_persona FROM persona WHERE id_persona = %s AND estado = 1", (vehiculo_actualizado.id_persona,))
        if not cursor.fetchone():
            raise ValueError(f"La nueva Persona (propietario) con ID {vehiculo_actualizado.id_persona} no existe o está inactiva.")

        # 4. Ejecutar la actualización
        query = """
        UPDATE vehiculo SET
            placa = %s,
            tipo = %s,
            color = %s,
            id_persona = %s
        WHERE id_vehiculo = %s
        """
        cursor.execute(query, (
            vehiculo_actualizado.placa,
            vehiculo_actualizado.tipo,
            vehiculo_actualizado.color,
            vehiculo_actualizado.id_persona,
            id_vehiculo
        ))
        
        conn.commit()

        # 5. Registrar Auditoría
        registrar_auditoria_global(
            id_usuario=id_vigilante_actual, # Asegúrate de usar el ID del usuario logueado
            entidad='persona',
            id_entidad=id_persona_nueva,
            accion='CREAR',
            datos_nuevos=nueva_persona.to_dict()
        )
        return True

    except Exception as e:
        if conn: conn.rollback()
        print(f"Error en actualizar_vehiculo_controller: {e}")
        raise Exception(f"Error interno al actualizar vehículo: {str(e)}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# En: backend/core/controller_vehiculos.py

def eliminar_vehiculo_controller(id_vehiculo, usuario_actual):
    """
    Elimina un vehículo (borrado real) de la base de datos.
    """
    conn = None
    cursor = None
    try:
        id_vigilante_actual = usuario_actual['id_audit']
        conn = get_connection()

        # 1. Obtener estado anterior para auditoría
        cursor_dict = conn.cursor(cursor_factory=RealDictCursor)
        cursor_dict.execute("SELECT * FROM vehiculo WHERE id_vehiculo = %s", (id_vehiculo,))
        vehiculo_anterior_db = cursor_dict.fetchone()
        cursor_dict.close()

        if not vehiculo_anterior_db:
            raise ValueError("Vehiculo no encontrado")

        vehiculo_anterior = Vehiculo(**vehiculo_anterior_db)

        # 2. Ejecutar el borrado real
        cursor = conn.cursor()
        cursor.execute("DELETE FROM vehiculo WHERE id_vehiculo = %s", (id_vehiculo,))
        conn.commit()

        # 3. Registrar Auditoría
        _registrar_auditoria(
            id_vigilante=id_vigilante_actual,
            entidad='vehiculo',
            id_entidad=id_vehiculo,
            accion='ELIMINAR',
            datos_previos=vehiculo_anterior.to_dict(),
            datos_nuevos=None # No hay datos nuevos
        )
        return True
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error en eliminar_vehiculo_controller: {e}")
        raise Exception(f"Error interno al eliminar vehículo: {str(e)}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()