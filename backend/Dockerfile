# ============================================================
# Dockerfile - Backend SmartCar (Flask)
# ============================================================
# Usar Python 3.11 slim
FROM python:3.11-slim

# Directorio de la app dentro del contenedor
WORKDIR /app

# Copiar todo el backend al contenedor
COPY backend/ /app

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Puerto que Render asigna
ENV PORT=10000

# Comando de inicio
CMD ["python", "server.py"]
