from flask import Blueprint, request, jsonify
from core.db.connection import get_connection
from core.security import create_jwt_token, hash_password, verify_password
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

login_bp = Blueprint('login', __name__)

ROL_TO_NIVEL = {
    "Administrador": 1,
    "Vigilante": 0
}

@login_bp.route("/login", methods=["POST"])
def login():
    """
    Ruta para manejar la solicitud de inicio de sesión.
    Valida credenciales y devuelve un JWT.
    """
    data = request.get_json()
    usuario = data.get('usuario')
    clave = data.get('clave')
    rol_str = data.get('rol')

    if not all([usuario, clave, rol_str]):
        return jsonify({"error": "Faltan datos de usuario, clave o rol"}), 400

    nivel_requerido = ROL_TO_NIVEL.get(rol_str)
    if nivel_requerido is None:
        return jsonify({"error": "Rol seleccionado no válido"}), 400

    conn = get_connection()
    if conn is None:
        return jsonify({"error": "Error interno. No se pudo conectar a la base de datos"}), 500

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT nu, nombre, clave, nivel 
            FROM tmusuarios 
            WHERE usuario = %s AND nivel = %s
            """,
            (usuario, nivel_requerido)
        )
        user_record = cur.fetchone()

        if user_record and verify_password(user_record['clave'], clave):
            # Generar JWT
            token_payload = {
                'nu': user_record['nu'],
                'nombre': user_record['nombre'],
                'nivel': user_record['nivel'],
                'exp': datetime.utcnow() + timedelta(hours=2)
            }
            token = create_jwt_token(token_payload)

            return jsonify({
                "message": "Autenticación exitosa",
                "token": token,
                "user": {
                    "id": user_record['nu'],
                    "nombre": user_record['nombre'],
                    "nivel": user_record['nivel']
                }
            }), 200
        else:
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401

    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
