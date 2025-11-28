# backend/routes/vehiculos_routes.py
# Define los Endpoints (/api/vehiculos) usando un Blueprint de Flask.
from flask import Blueprint, request, jsonify
from core.controller_vehiculos import (
    obtener_vehiculos_controller,
    crear_vehiculo_controller,
    actualizar_vehiculo_controller
)
from core.security import validate_jwt_token  # Para extraer usuario del token

vehiculos_bp = Blueprint('vehiculos_bp', __name__)

# --- GET /api/vehiculos ---
@vehiculos_bp.route('/api/vehiculos', methods=['GET'])
def get_vehiculos():
    try:
        vehiculos = obtener_vehiculos_controller()
        return jsonify(vehiculos), 200
    except Exception as e:
        print(f"Error en GET /api/vehiculos: {e}")
        return jsonify({"error": str(e)}), 500

# --- POST /api/vehiculos ---
@vehiculos_bp.route('/api/vehiculos', methods=['POST'])
def create_vehiculo():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400

        # Extraer usuario del token
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        usuario_actual = validate_jwt_token(token)
        if not usuario_actual:
            return jsonify({"error": "Token inválido o expirado"}), 401

        nuevo_id = crear_vehiculo_controller(data, usuario_actual)
        return jsonify({"mensaje": "Vehículo creado exitosamente", "id_vehiculo": nuevo_id}), 201

    except ValueError as ve:
        status_code = 401 if "Token" in str(ve) else 400
        return jsonify({"error": str(ve)}), status_code
    except Exception as e:
        print(f"Error en POST /api/vehiculos: {e}")
        return jsonify({"error": str(e)}), 500

# --- PUT /api/vehiculos/<int:id_vehiculo> ---
@vehiculos_bp.route('/api/vehiculos/<int:id_vehiculo>', methods=['PUT'])
def update_vehiculo(id_vehiculo):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400

        # Extraer usuario del token
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        usuario_actual = validate_jwt_token(token)
        if not usuario_actual:
            return jsonify({"error": "Token inválido o expirado"}), 401

        actualizar_vehiculo_controller(id_vehiculo, data, usuario_actual)
        return jsonify({"mensaje": "Vehículo actualizado exitosamente"}), 200

    except ValueError as ve:
        if "no encontrado" in str(ve):
            return jsonify({"error": str(ve)}), 404
        else:
            status_code = 401 if "Token" in str(ve) else 400
            return jsonify({"error": str(ve)}), status_code
    except Exception as e:
        print(f"Error en PUT /api/vehiculos/{id_vehiculo}: {e}")
        return jsonify({"error": str(e)}), 500
