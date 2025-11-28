# ===========================================================
#  SmartCar - Servidor Principal con Seguridad JWT
# ===========================================================
import sys
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import os
from core.auditoria_utils import registrar_auditoria_global
from functools import wraps

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

# Importar funciones de conexión y modelo de usuario
from core.db.connection import get_connection
from models.user_model import verificar_usuario

# ===========================================================  
# IMPORTAR RUTAS DE PERSONAS Y VEHÍCULOS
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
#  ===========================================================
# IMPORTAR FUNCIONES DE AUDITORÍA
from models.auditoria import obtener_historial_auditoria
# ===========================================================
#importar controladores de accesos
from core.controller_accesos import (
    obtener_historial_accesos, 
    procesar_validacion_acceso
)
# ===========================================================
#importar controladores de calendario
from core.controller_calendario import (
    obtener_eventos_controller,
    crear_evento_controller,
    actualizar_evento_controller,
    eliminar_evento_controller,
    verificar_evento_controller
)
# ===========================================================
# importar controladores de incidencias y alertas
from core.controller_alertas import obtener_alertas_controller, eliminar_alerta_controller, obtener_mis_reportes_controller
from core.controller_incidencias import obtener_vehiculos_en_patio, crear_incidente_manual, crear_novedad_general
# ===========================================================
# RUTAS CORRECTAS PARA FRONTEND
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "frontend", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "static")

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)
CORS(app)


# ===========================================================
# CONFIGURACIÓN INICIAL
# ===========================================================


# 🔒 Clave secreta para JWT
app.config["SECRET_KEY"] = "SmartCar_SeguridadUltra_2025"

# ===========================================================
# DECORADOR: VALIDAR TOKEN JWT
# ===========================================================
def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token no proporcionado"}), 401

        try:
            token = token.replace("Bearer ", "")
            datos = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            # ➡️ Guardamos los datos del token en el request
            request.usuario_actual = datos
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        return f(*args, **kwargs)
    return decorador


# ===========================================================
# RUTAS PÚBLICAS
# ===========================================================
@app.route("/")
def index():
    """Página principal: formulario de login"""
    return render_template("login.html")

# ===========================================================
# RUTA DE LOGIN
# ===========================================================
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        usuario = data.get("usuario")
        clave = data.get("clave")
        rol = data.get("rol")

        if not usuario or not clave or not rol:
            return jsonify({"error": "Faltan campos requeridos"}), 400

        # Verificar usuario en la base
        user = verificar_usuario(usuario, clave, rol)
        if not user:
            return jsonify({"error": "Usuario, clave o rol incorrectos"}), 401

        # El 'user' tiene 'id_audit' (que es el 'nu' de tmusuarios)
        # Lo incluimos en el token.
        token = jwt.encode({
            "usuario": user["usuario"],
            "rol": user["rol"],
            "id_audit": user["id_audit"], # <-- ID de auditoría
            "exp": datetime.utcnow() + timedelta(hours=2)
        }, app.config["SECRET_KEY"], algorithm="HS256")
        
        print(f"✅ Login exitoso: {user['usuario']} ({user['rol']}) ID: {user['id_audit']}")
        
        # --- NUEVO: AUDITORÍA DE LOGIN ---
        registrar_auditoria_global(
            id_usuario=user["id_audit"],  # Este es el 'nu' de tmusuarios
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
# RUTAS PROTEGIDAS
# ===========================================================
# IMPORTAR CONTROLADORES DE ALERTAS
from core.controller_alertas import obtener_alertas_controller, eliminar_alerta_controller
# ================================================
# DASHBOARD VIGILANTE (Rutas API)
# ================================================
@app.route("/dashboard_vigilante")
def dashboard_vigilante():
    return render_template("dashboard_vigilante.html")

from models.dashboard_model import (
    obtener_ultimos_accesos,
    contar_total_vehiculos,
    contar_alertas_activas,
    buscar_placa_bd
)

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

# ================================================
# DASHBOARD ADMINISTRADOR (Rutas API)
from models.admin_model import (
    obtener_datos_dashboard,
    obtener_accesos_detalle,
    registrar_vigilante
)
from io import BytesIO
from flask import send_file
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

@app.route("/dashboard_admin")
def dashboard_admin():
    return render_template("dashboard_admin.html")

@app.route("/api/admin/resumen", methods=["GET"])
@token_requerido # Protegemos la ruta
def api_admin_resumen():
    data = obtener_datos_dashboard()
    return jsonify(data)

@app.route("/api/admin/accesos", methods=["GET"])
@token_requerido # Protegemos la ruta
def api_admin_accesos():
    data = obtener_accesos_detalle()
    return jsonify(data)

@app.route("/api/admin/registrar_vigilante", methods=["POST"])
@token_requerido # Protegemos la ruta
def api_registrar_vigilante():
    data = request.get_json()
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
@token_requerido # Protegemos la ruta
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
            pdf.drawString(40, y, item['placa'])
            pdf.drawString(120, y, item['tipo'])
            pdf.drawString(230, y, item['color'])
            pdf.drawString(340, y, item['propietario'])
            pdf.drawString(500, y, item['resultado'])
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
@token_requerido # Protegemos la ruta
def exportar_excel():
    try:
        data = obtener_accesos_detalle()
        wb = Workbook()
        ws = wb.active
        ws.title = "Vehículos"
        ws.append(["Placa", "Tipo", "Color", "Propietario", "Resultado"])
        for d in data:
            ws.append([d["placa"], d["tipo"], d["color"], d["propietario"], d["resultado"]])
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
# --- CRUD de Personas ---

@app.route("/api/personas", methods=["GET"])
@token_requerido
def get_personas():
    """Endpoint para OBTENER todas las personas activas."""
    try:
        personas = obtener_personas_controller()
        return jsonify(personas), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/personas", methods=["POST"])
@token_requerido
def create_persona():
    """Endpoint para CREAR una nueva persona."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        
        # ✅ CORREGIDO: Pasamos el objeto 'usuario_actual' del token
        nuevo_id = crear_persona_controller(data, request.usuario_actual)
        
        return jsonify({"mensaje": "Persona creada exitosamente", "id_persona": nuevo_id}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/personas/<int:id_persona>", methods=["PUT"])
@token_requerido
def update_persona(id_persona):
    """Endpoint para ACTUALIZAR una persona existente."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        
        # ✅ CORREGIDO: Pasamos el objeto 'usuario_actual' del token
        actualizar_persona_controller(id_persona, data, request.usuario_actual)
        
        return jsonify({"mensaje": "Persona actualizada exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404 if "no encontrada" in str(ve) else 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/personas/<int:id_persona>", methods=["DELETE"])
@token_requerido
def delete_persona(id_persona):
    """Endpoint para DESACTIVAR una persona (borrado lógico)."""
    try:
        desactivar_persona_controller(id_persona, request.usuario_actual)
        return jsonify({"mensaje": "Persona desactivada exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- CRUD de Vehículos ---

@app.route("/api/vehiculos", methods=["GET"])
@token_requerido
def get_vehiculos():
    """Endpoint para OBTENER todos los vehículos."""
    try:
        vehiculos = obtener_vehiculos_controller()
        return jsonify(vehiculos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vehiculos", methods=["POST"])
@token_requerido
def create_vehiculo():
    """Endpoint para CREAR un nuevo vehículo."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        
        # ✅ CORREGIDO: Pasamos el objeto 'usuario_actual' del token
        nuevo_id = crear_vehiculo_controller(data, request.usuario_actual)
        
        return jsonify({"mensaje": "Vehículo creado exitosamente", "id_vehiculo": nuevo_id}), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vehiculos/<int:id_vehiculo>", methods=["PUT"])
@token_requerido
def update_vehiculo(id_vehiculo):
    """Endpoint para ACTUALIZAR un vehículo existente."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Cuerpo de la petición vacío"}), 400
        
        # ✅ CORREGIDO: Pasamos el objeto 'usuario_actual' del token
        actualizar_vehiculo_controller(id_vehiculo, data, request.usuario_actual)
        
        return jsonify({"mensaje": "Vehículo actualizado exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404 if "no encontrado" in str(ve) else 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/vehiculos/<int:id_vehiculo>", methods=["DELETE"])
@token_requerido
def delete_vehiculo(id_vehiculo):
    """Endpoint para ELIMINAR un vehículo (borrado real)."""
    try:
        eliminar_vehiculo_controller(id_vehiculo, request.usuario_actual)
        return jsonify({"mensaje": "Vehículo eliminado exitosamente"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================================================
@app.route("/api/usuario", methods=["GET"])
@token_requerido
def obtener_usuario():
    """Devuelve datos del usuario autenticado"""
    datos = request.usuario_actual
    return jsonify({
        "status": "ok",
        "user": datos
    }), 200


@app.route("/api/dashboard_vigilante", methods=["GET"])
@token_requerido # Protegemos la ruta
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
# RUTA PARA HISTORIAL DE ACCESOS
# 1. Ruta para llenar la Tabla (GET)
# Busca la ruta existente y REEMPLÁZALA por esta:
@app.route("/api/accesos", methods=["GET"])
@token_requerido
def get_historial_accesos():
    try:
        # Recogemos los parámetros de la URL (Query Params)
        filtros = {
            "placa": request.args.get('placa'),
            "tipo": request.args.get('tipo'),
            "desde": request.args.get('desde'),
            "hasta": request.args.get('hasta')
        }
        
        # Llamamos al controlador con los filtros
        historial = obtener_historial_accesos(filtros)
        return jsonify(historial), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# 2. Ruta para el Modal de OCR (POST)
@app.route("/api/accesos/validar", methods=["POST"])
# @token_requerido  <-- OJO: Tu frontend modal NO está enviando token en el fetch. 
# Por ahora la dejamos abierta o debes actualizar el fetch en el modal.
def validar_acceso_ocr():
    try:
        # Pasamos el cuerpo crudo como espera tu función
        # Asumimos ID vigilante 1 por defecto si no hay token
        respuesta, status = procesar_validacion_acceso(request.data, vigilante_id=1)
        return jsonify(respuesta), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ===========================================================
# RUTA PARA ALERTAS

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
    
# ===========================================================
# RUTAS PARA CALENDARIO DE EVENTOS
@app.route("/api/eventos", methods=["GET"])
@token_requerido
def get_eventos():
    """Obtener todos los eventos (Admin y Vigilante)"""
    try:
        eventos = obtener_eventos_controller()
        return jsonify(eventos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/eventos", methods=["POST"])
@token_requerido
def create_evento():
    """Crear evento (Solo Admin)"""
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
    """Actualizar evento (Solo Admin)"""
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
    """Eliminar evento (Solo Admin)"""
    if request.usuario_actual.get('rol') != 'Administrador':
        return jsonify({"error": "No autorizado"}), 403
    
    try:
        # CORRECCIÓN: Pasamos 'request.usuario_actual' como segundo parámetro
        if eliminar_evento_controller(id_evento, request.usuario_actual):
            return jsonify({"mensaje": "Evento eliminado correctamente"}), 200
        else:
            return jsonify({"error": "Evento no encontrado o no se pudo eliminar"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/eventos/<int:id_evento>/verificar", methods=["PUT"])
@token_requerido
def verify_evento(id_evento):
    """Verificar evento (Vigilante y Admin)"""
    # Aquí permitimos a ambos roles confirmar la realización del evento
    try:
        data = request.get_json()
        verificado = data.get('verificado', True)
        verificar_evento_controller(id_evento, verificado)
        return jsonify({"mensaje": "Estado de verificación actualizado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================================================
#ruta para obtener vehículos en patio
@app.route("/api/vigilante/mis-reportes", methods=["GET"])
@token_requerido
def get_mis_reportes():
    """Historial de reportes del vigilante actual"""
    try:
        id_vigilante = request.usuario_actual['id_audit']
        reportes = obtener_mis_reportes_controller(id_vigilante)
        return jsonify(reportes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/vigilante/novedad-general", methods=["POST"])
@token_requerido
def post_novedad_general():
    """Crear novedad sin vehículo asociado"""
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
# ===========================================================
# RUTA PARA ARCHIVOS ESTÁTICOS
# ===========================================================
@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

# ===========================================================
# TEST DE CONEXIÓN A BD
# ===========================================================
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
# INICIO DEL SERVIDOR
# ===========================================================
if __name__ == "__main__":
    print("✅ Servidor SmartCar ejecutándose en http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
