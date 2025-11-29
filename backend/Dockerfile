# ============================================================
# Dockerfile - Backend SmartCar (Flask)
# ============================================================
# Usar Python 3.11 slim
FROM python:3.11-slim

WORKDIR /app

# Copiar todo el contenido del backend al contenedor
COPY . /app

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r backend/requirements.txt

ENV PORT=10000

CMD ["python", "server.py"]
