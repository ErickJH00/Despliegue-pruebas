# core/security.py

import hashlib
import jwt
import datetime
import os

# 🔒 Llave secreta desde variable de entorno
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "cambia-esto-por-una-llave-secreta-muy-larga-y-segura")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 30


# ============================
# Hash de contraseñas
# ============================
def hash_password(password: str) -> str:
    """
    Convierte una contraseña en un hash SHA256.
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(stored_hash: str, provided_password: str) -> bool:
    """
    Verifica si la contraseña proporcionada coincide con el hash almacenado.
    """
    return stored_hash == hash_password(provided_password)


# ============================
# JWT
# ============================
def create_jwt_token(user_data: dict, expiration_minutes: int = JWT_EXPIRATION_MINUTES) -> str:
    """
    Crea un nuevo token JWT para la sesión del usuario.
    user_data: dict con información del usuario (id, rol, etc)
    expiration_minutes: tiempo de expiración en minutos
    """
    try:
        now = datetime.datetime.utcnow()
        payload = {
            "sub": user_data,        # Datos del usuario
            "iat": now,              # Fecha de emisión
            "exp": now + datetime.timedelta(minutes=expiration_minutes)  # Expiración
        }
        
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return token

    except Exception as e:
        print(f"[JWT] Error al crear el token: {e}")
        return None


def validate_jwt_token(token: str) -> dict:
    """
    Valida un token JWT.
    Devuelve los datos del usuario si es válido, None si no.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get('sub')
    except jwt.ExpiredSignatureError:
        print("[JWT] Token ha expirado")
        return None
    except jwt.InvalidTokenError:
        print("[JWT] Token inválido")
        return None


# ============================
# Helper para refresh token opcional
# ============================
def refresh_jwt_token(token: str, extra_minutes: int = 30) -> str:
    """
    Permite refrescar un token expirado recientemente (opcional).
    """
    user_data = validate_jwt_token(token)
    if user_data is None:
        return None
    return create_jwt_token(user_data, expiration_minutes=extra_minutes)

    #necesito editar este archivo
