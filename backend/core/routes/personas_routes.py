# backend/routes/personas_routes.py
# Define los Endpoints (/api/personas) usando un Blueprint de Flask.
from flask import Blueprint, request, jsonify
from core.controller_personas import (
    obtener_personas_controller,
    crear_persona_controller,
    actualizar_persona_controller
)
from core.security import validate_jwt_token  # Para extraer usuario del token

personas_bp = Blueprint('personas_bp', __name__)

# --- GET /api/personas ---
@personas_bp.route('/api/personas', methods=['GET'])
def get_personas():
    try:
        personas = obtener_personas_controller()
        return jsonify(personas), 200
    except Exception as e:
        print(f"Error en GET /api/personas: {e}")
        return jsonify({"error": str(e)}), 500

# --- POST /api/personas ---
@personas_bp.route('/api/personas', methods=['POST'])
def create_persona():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        
        # Extraer usuario del token
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        usuario_actual = validate_jwt_token(token)
        if not usuario_actual:
            return jsonify({"error": "Token inválido o expirado"}), 401

        nuevo_id = crear_persona_controller(data, usuario_actual)
        return jsonify({"mensaje": "Persona creada exitosamente", "id_persona": nuevo_id}), 201

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 401 if "Token" in str(ve) else 400
    except Exception as e:
        print(f"Error en POST /api/personas: {e}")
        return jsonify({"error": str(e)}), 500

# --- PUT /api/personas/<int:id_persona> ---
@personas_bp.route('/api/personas/<int:id_persona>', methods=['PUT'])
def update_persona(id_persona):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400

        # Extraer usuario del token
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        usuario_actual = validate_jwt_token(token)
        if not usuario_actual:
            return jsonify({"error": "Token inválido o expirado"}), 401

        actualizar_persona_controller(id_persona, data, usuario_actual)
        return jsonify({"mensaje": "Persona actualizada exitosamente"}), 200

    except ValueError as ve:
        if "no encontrada" in str(ve):
            return jsonify({"error": str(ve)}), 404
        else:
            return jsonify({"error": str(ve)}), 401
    except Exception as e:
        print(f"Error en PUT /api/personas/{id_persona}: {e}")
        return jsonify({"error": str(e)}), 500
