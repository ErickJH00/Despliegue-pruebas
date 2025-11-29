# server.py - SmartCar (versión corregida para despliegue)
# ===========================================================
import os
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
import jwt

# IMPORTS LOCALES (mantén la estructura de tu repo)
# Importantes: asumo que este archivo está en backend/ y que las rutas relativas funcionan.
from core.auditoria_utils import registrar_auditoria_global
from core.db.connection import get_connection
from models.user_model import verificar_usuario

# Importar controladores (dejé tus imports tal cual)
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

# Librerías para export (si no están instaladas, agrégalas al requirements)
from io import BytesIO
from flask import send_file
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

# usa SECRET_KEY desde variable de entorno si está disponible
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "SmartCar_SeguridadUltra_2025")

# ===========================================================
# Decorador: validar token JWT
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
# DASHBOARD VIGILANTE (Rutas API)
@app.route("/dashboard_vigilante")
def dashboard_vigilante():
    return render_template("dashboard_vigilante.html")

@app.route("/api/ultimos_accesos", methods=["GET"])
def api_ultimos_accesos():
    data = obtener_ultimos_accesos()
    return jsonify(data)

@app.route("/api/total_vehiculos", methods=["GET"])
def api_total_vehiculos():
    data = contar_total_vehiculos()
    return jsonify(data)

@app.route("/api/alertas_activas", methods=["GET"])
def api_alertas_activas():
    data = contar_alertas_activas()
    return jsonify(data)

@app.route("/api/buscar_placa/<placa>", methods=["GET"])
def api_buscar_placa(placa):
    data = buscar_placa_bd(placa)
    if data:
        return jsonify(data)
    else:
        return jsonify({"error": "Placa no encontrada"}), 404

# ===========================================================
# DASHBOARD ADMIN (Rutas API) y exportaciones (pdf/excel)
@app.route("/dashboard_admin")
def dashboard_admin():
    return render_template("dashboard_admin.html")

@app.route("/api/admin/resumen", methods=["GET"])
@token_requerido
def api_admin_resumen():
    data = obtener_datos_dashboard()
    return jsonify(data)

@app.route("/api/admin/accesos", methods=["GET"])
@token_requerido
def api_admin_accesos():
    data = obtener_accesos_detalle()
    return jsonify(data)

@app.route("/api/admin/registrar_vigilante", methods=["POST"])
@token_requerido
def api_registrar_vigilante():
    data = request.get_json() or {}
    ok = registrar_vigilante(
        data.get("nombre"),
        data.get("doc_identidad"),
        data.get("telefono"),
        data.get("id_rol")
    )
    if ok:
        return jsonify({"status": "ok"})
    return jsonify({"error": "No se pudo registrar"}), 500

@app.route("/api/admin/auditoria", methods=["GET"])
@token_requerido
def api_admin_auditoria():
    if request.usuario_actual.get('rol') != 'Administrador':
        return jsonify({"error": "Acceso no autorizado"}), 403
    try:
        historial = obtener_historial_auditoria()
        return jsonify(historial), 200
    except Exception as e:
        print(f"❌ Error obteniendo historial de auditoría: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.route("/api/admin/exportar/pdf", methods=["GET"])
@token_requerido
def exportar_pdf():
    try:
        data = obtener_accesos_detalle()
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        pdf.setTitle("Reporte de Vehículos - SmartCar")
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(200, 750, "REPORTE DE VEHÍCULOS REGISTRADOS")
        pdf.setFont("Helvetica", 11)
        y = 720
        pdf.drawString(40, y, "Placa")
        pdf.drawString(120, y, "Tipo")
        pdf.drawString(230, y, "Color")
        pdf.drawString(340, y, "Propietario")
        pdf.drawString(500, y, "Resultado")
        y -= 20
        for item in data:
            pdf.drawString(40, y, item.get('placa', ''))
            pdf.drawString(120, y, item.get('tipo', ''))
            pdf.drawString(230, y, item.get('color', ''))
            pdf.drawString(340, y, item.get('propietario', ''))
            pdf.drawString(500, y, item.get('resultado', ''))
            y -= 15
            if y < 50:
                pdf.showPage()
                pdf.setFont("Helvetica", 11)
                y = 750
        pdf.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name="reporte_vehiculos.pdf", mimetype="application/pdf")
    except Exception as e:
        print("❌ Error generando PDF:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/exportar/excel", methods=["GET"])
@token_requerido
def exportar_excel():
    try:
        data = obtener_accesos_detalle()
        wb = Workbook()
        ws = wb.active
        ws.title = "Vehículos"
        ws.append(["Placa", "Tipo", "Color", "Propietario", "Resultado"])
        for d in data:
            ws.append([d.get("placa", ""), d.get("tipo", ""), d.get("color", ""), d.get("propietario", ""), d.get("resultado", "")])
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name="reporte_vehiculos.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        print("❌ Error generando Excel:", e)
        return jsonify({"error": str(e)}), 500

# ===========================================================
# CRUD Personas y Vehículos (se mantienen tus funciones)
@app.route("/api/personas", methods=["GET"])
@token_requerido
def get_personas():
    try:
        personas = obtener_personas_controller()
        return jsonify(personas), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/personas", methods=["POST"])
@token_requerido
def create_persona():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        nuevo_id = crear_persona_controller(data, request.usuario_actual)
        return jsonify({"mensaje": "Persona creada exitosamente", "id_persona": nuevo_id}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/personas/<int:id_persona>", methods=["PUT"])
@token_requerido
def update_persona(id_persona):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        actualizar_persona_controller(id_persona, data, request.usuario_actual)
        return jsonify({"mensaje": "Persona actualizada exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404 if "no encontrada" in str(ve) else 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/personas/<int:id_persona>", methods=["DELETE"])
@token_requerido
def delete_persona(id_persona):
    try:
        desactivar_persona_controller(id_persona, request.usuario_actual)
        return jsonify({"mensaje": "Persona desactivada exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vehiculos", methods=["GET"])
@token_requerido
def get_vehiculos():
    try:
        vehiculos = obtener_vehiculos_controller()
        return jsonify(vehiculos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vehiculos", methods=["POST"])
@token_requerido
def create_vehiculo():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        nuevo_id = crear_vehiculo_controller(data, request.usuario_actual)
        return jsonify({"mensaje": "Vehículo creado exitosamente", "id_vehiculo": nuevo_id}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vehiculos/<int:id_vehiculo>", methods=["PUT"])
@token_requerido
def update_vehiculo(id_vehiculo):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        actualizar_vehiculo_controller(id_vehiculo, data, request.usuario_actual)
        return jsonify({"mensaje": "Vehículo actualizado exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404 if "no encontrado" in str(ve) else 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vehiculos/<int:id_vehiculo>", methods=["DELETE"])
@token_requerido
def delete_vehiculo(id_vehiculo):
    try:
        eliminar_vehiculo_controller(id_vehiculo, request.usuario_actual)
        return jsonify({"mensaje": "Vehículo eliminado exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# Dashboard vigilante API (datos resumidos)
@app.route("/api/dashboard_vigilante", methods=["GET"])
@token_requerido
def get_dashboard_data():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT TO_CHAR(fecha_hora, 'HH24:MI'),
                   vehiculo.placa,
                   CASE WHEN LOWER(resultado) LIKE '%concedido%' THEN 'Verde' ELSE 'Rojo' END AS estado
            FROM acceso
            JOIN vehiculo ON acceso.id_vehiculo = vehiculo.id_vehiculo
            ORDER BY fecha_hora DESC LIMIT 5;
        """)
        historial = cur.fetchall()
        cur.execute("SELECT COUNT(*) FROM alerta;")
        alertas = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM vehiculo;")
        total_vehiculos = cur.fetchone()[0]
        cur.close()
        conn.close()
        return jsonify({
            "historial": historial,
            "alertas": alertas,
            "vehiculos": total_vehiculos
        })
    except Exception as e:
        print("❌ Error cargando datos dashboard:", e)
        return jsonify({"error": "Error al cargar datos"}), 500

# ===========================================================
# Accesos: historial y OCR (la función procesar_validacion_acceso la maneja tu controlador)
@app.route("/api/accesos", methods=["GET"])
@token_requerido
def get_historial_accesos():
    try:
        filtros = {
            "placa": request.args.get('placa'),
            "tipo": request.args.get('tipo'),
            "desde": request.args.get('desde'),
            "hasta": request.args.get('hasta')
        }
        historial = obtener_historial_accesos(filtros)
        return jsonify(historial), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/accesos/validar", methods=["POST"])
def validar_acceso_ocr():
    try:
        respuesta, status = procesar_validacion_acceso(
            request.data,
            vigilante_id=getattr(request, 'usuario_actual', {}).get('id_audit', 1)
        )
        return jsonify(respuesta), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
# Alertas, eventos y vigilante (mantengo tu lógica)
@app.route("/api/admin/alertas", methods=["GET"])
@token_requerido
def get_alertas():
    try:
        alertas = obtener_alertas_controller()
        return jsonify(alertas), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/alertas/<int:id_alerta>", methods=["DELETE"])
@token_requerido
def delete_alerta(id_alerta):
    try:
        if eliminar_alerta_controller(id_alerta):
            return jsonify({"mensaje": "Alerta resuelta/eliminada"}), 200
        else:
            return jsonify({"error": "No se pudo eliminar"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/eventos", methods=["GET"])
@token_requerido
def get_eventos():
    try:
        eventos = obtener_eventos_controller()
        return jsonify(eventos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/eventos", methods=["POST"])
@token_requerido
def create_evento():
    if request.usuario_actual.get('rol') != 'Administrador':
        return jsonify({"error": "No autorizado"}), 403
    try:
        data = request.get_json()
        id_nuevo = crear_evento_controller(data, request.usuario_actual)
        return jsonify({"mensaje": "Evento creado", "id": id_nuevo}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/eventos/<int:id_evento>", methods=["PUT"])
@token_requerido
def update_evento(id_evento):
    if request.usuario_actual.get('rol') != 'Administrador':
        return jsonify({"error": "No autorizado"}), 403
    try:
        data = request.get_json()
        actualizar_evento_controller(id_evento, data)
        return jsonify({"mensaje": "Evento actualizado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/eventos/<int:id_evento>", methods=["DELETE"])
@token_requerido
def delete_evento(id_evento):
    if request.usuario_actual.get('rol') != 'Administrador':
        return jsonify({"error": "No autorizado"}), 403
    try:
        if eliminar_evento_controller(id_evento, request.usuario_actual):
            return jsonify({"mensaje": "Evento eliminado correctamente"}), 200
        else:
            return jsonify({"error": "Evento no encontrado o no se pudo eliminar"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/eventos/<int:id_evento>/verificar", methods=["PUT"])
@token_requerido
def verify_evento(id_evento):
    try:
        data = request.get_json()
        verificado = data.get('verificado', True)
        verificar_evento_controller(id_evento, verificado)
        return jsonify({"mensaje": "Estado de verificación actualizado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vigilante/mis-reportes", methods=["GET"])
@token_requerido
def get_mis_reportes():
    try:
        id_vigilante = request.usuario_actual['id_audit']
        reportes = obtener_mis_reportes_controller(id_vigilante)
        return jsonify(reportes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vigilante/novedad-general", methods=["POST"])
@token_requerido
def post_novedad_general():
    try:
        data = request.get_json()
        id_vigilante = request.usuario_actual['id_audit']
        if crear_novedad_general(data, id_vigilante):
            return jsonify({"mensaje": "Novedad registrada"}), 201
        else:
            return jsonify({"error": "No se pudo registrar"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vigilante/vehiculos-en-patio", methods=["GET"])
@token_requerido
def get_vehiculos_patio():
    try:
        vehiculos = obtener_vehiculos_en_patio()
        return jsonify(vehiculos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vigilante/reportar", methods=["POST"])
@token_requerido
def post_reportar_incidente():
    try:
        data = request.get_json()
        id_vigilante = request.usuario_actual['id_audit']
        if crear_incidente_manual(data, id_vigilante):
            return jsonify({"mensaje": "Incidente reportado"}), 201
        else:
            return jsonify({"error": "Error al reportar"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Archivos estáticos y test DB
@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route("/test_db")
def test_db():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT NOW();")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({"estado": "ok", "hora_bd": str(result[0])})
    except Exception as e:
        return jsonify({"estado": "error", "detalle": str(e)}), 500

# ===========================================================
# Blueprints (si existen) - registrar ANTES de arrancar la app
try:
    from routes.personas_routes import personas_bp
    from routes.vehiculos_routes import vehiculos_bp
    from core.routes.cars_routes import cars_bp
    from login_routes import login_bp

    app.register_blueprint(personas_bp)
    app.register_blueprint(vehiculos_bp)
    app.register_blueprint(cars_bp)
    app.register_blueprint(login_bp)
except Exception as e:
    # Si no existen las rutas, no fallamos el arranque; imprimimos la info.
    print("Info: no se pudieron registrar algunos blueprints (puede que no existan):", e)

# ===========================================================
# Middleware global para /api (duplicado temporalmente - se puede mantener o eliminar)
@app.before_request
def verificar_token_before_request():
    if request.path.startswith("/api"):
        # Evitamos proteger login
        if request.path.startswith("/api/login") or request.path.startswith("/api/public"):
            return

        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token requerido"}), 401

        token = token.replace("Bearer ", "")
        try:
            datos = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            request.usuario_actual = datos
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

# ===========================================================
# Arranque del servidor (usar 0.0.0.0 y puerto desde env var)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("FLASK_ENV", "production") == "development"
    print(f"✅ Servidor SmartCar ejecutándose en http://{host}:{port} (debug={debug})")
    app.run(host=host, port=port, debug=debug)
