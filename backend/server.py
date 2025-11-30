# server.py - SmartCar (versión corregida para despliegue)
# ===========================================================
# server.py - SmartCar (versión corregida para despliegue)
# ===========================================================
# server.py - SmartCar (versión corregida para despliegue)
# ===========================================================
import os
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request, render_template, send_from_directory, send_file
from flask_cors import CORS
import jwt

# IMPORTS LOCALES
from core.auditoria_utils import registrar_auditoria_global
from core.db.connection import get_connection
from models.user_model import verificar_usuario

# Controladores
from core.controller_personas import (
    desactivar_persona_controller,
    obtener_personas_controller,
    crear_persona_controller,
    actualizar_persona_controller
)
from core.controller_vehiculos import (
    eliminar_vehiculo_controller,
    obtener_vehiculos_controller,
    crear_vehiculo_controller,
    actualizar_vehiculo_controller
)
from core.controller_accesos import (
    obtener_historial_accesos,
    procesar_validacion_acceso
)
from core.controller_calendario import (
    obtener_eventos_controller,
    crear_evento_controller,
    actualizar_evento_controller,
    eliminar_evento_controller,
    verificar_evento_controller
)
from core.controller_alertas import obtener_alertas_controller, eliminar_alerta_controller, obtener_mis_reportes_controller
from core.controller_incidencias import obtener_vehiculos_en_patio, crear_incidente_manual, crear_novedad_general

from models.dashboard_model import (
    obtener_ultimos_accesos,
    contar_total_vehiculos,
    contar_alertas_activas,
    buscar_placa_bd
)
from models.admin_model import (
    obtener_datos_dashboard,
    obtener_accesos_detalle,
    registrar_vigilante
)
from models.auditoria import obtener_historial_auditoria

# Librerías para export
from io import BytesIO
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# ===========================================================
# App config
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "frontend", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "static")

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)
CORS(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "SmartCar_SeguridadUltra_2025")

# ===========================================================
# Decorador JWT
def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token no proporcionado"}), 401
        try:
            token = token.replace("Bearer ", "")
            datos = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            request.usuario_actual = datos
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401
        return f(*args, **kwargs)
    return decorador

# ===========================================================
# Rutas públicas y login
@app.route("/")
def index():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}
        usuario = data.get("usuario")
        clave = data.get("clave")
        rol = data.get("rol")
        if not usuario or not clave or not rol:
            return jsonify({"error": "Faltan campos requeridos"}), 400

        user = verificar_usuario(usuario, clave, rol)
        if not user:
            return jsonify({"error": "Usuario, clave o rol incorrectos"}), 401

        token = jwt.encode({
            "usuario": user["usuario"],
            "rol": user["rol"],
            "id_audit": user["id_audit"],
            "exp": datetime.utcnow() + timedelta(hours=2)
        }, app.config["SECRET_KEY"], algorithm="HS256")

        registrar_auditoria_global(
            id_usuario=user["id_audit"],
            entidad="SISTEMA",
            id_entidad=0,
            accion="INICIO_SESION",
            datos_nuevos={"usuario": user["usuario"], "rol": user["rol"]}
        )

        return jsonify({
            "status": "ok",
            "token": token,
            "user": {
                "nombre": user["nombre"],
                "usuario": user["usuario"],
                "rol": user["rol"]
            }
        }), 200

    except Exception as e:
        print("❌ Error en login:", e)
        return jsonify({"error": "Error interno del servidor"}), 500

# ===========================================================
# Aquí van todas tus rutas existentes (dashboard, CRUD, exportaciones, alertas, OCR, etc.)
# Mantener exactamente como me enviaste hasta el final

# ===========================================================
# Bloque final para Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
