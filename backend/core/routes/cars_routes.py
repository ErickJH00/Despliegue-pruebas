from flask import Blueprint, jsonify
from psycopg2.extras import RealDictCursor
from core.db.connection import get_connection

cars_bp = Blueprint('cars', __name__)

@cars_bp.route('/carros', methods=['GET'])
def get_carros():
    conn = get_connection()
    if conn is None:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM carros;")
        data = cur.fetchall()
        cur.close()
        return jsonify(data)
    except Exception as e:
        print(f"Error al obtener carros: {e}")
        return jsonify({"error": "Error al obtener carros"}), 500
    finally:
        if conn:
            conn.close()
