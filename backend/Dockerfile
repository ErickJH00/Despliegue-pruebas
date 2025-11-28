# ============================================================
# Dockerfile - Backend SmartCar (Flask)
# ============================================================

FROM python:3.11-slim

# Crear directorio dentro del contenedor
WORKDIR /app

# Copiar requirements primero para cache eficiente
COPY requirements.txt .

# Instalar dependencias del backend
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del backend
COPY . .

# Render usa PORT, así que lo respetamos
ENV PORT=5000

EXPOSE 5000

# Ejecutar el servidor
CMD ["python", "server.py"]
