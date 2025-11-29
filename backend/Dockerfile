# ============================================================
# Dockerfile - Backend SmartCar (Flask + Tesseract OCR)
# ============================================================

FROM python:3.11-slim

# Evita mensajes interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema (tesseract + libs necesarias)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    libleptonica-dev \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo requirements primero (mejor caché)
COPY backend/requirements.txt /app/backend/requirements.txt

# Instalar dependencias Python
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copiar todo el backend al contenedor
COPY backend /app/backend
COPY server.py /app/server.py

# Render asignará este puerto
ENV PORT=10000

# Comando de producción: GUNICORN
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:10000", "--workers", "2"]
