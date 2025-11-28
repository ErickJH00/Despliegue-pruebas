import cv2
import easyocr
import numpy as np
import base64
import os
import re

# --- 1. INICIALIZACIÓN DEL LECTOR (TAREA PESADA) ---
# Esto se ejecuta solo una vez cuando se importa el módulo.
# 'es' = español, 'en' = inglés. Agregamos ambos.
# gpu=False para asegurar compatibilidad en Docker sin GPU.
print("Cargando modelo EasyOCR en memoria...")
try:
    reader = easyocr.Reader(['es', 'en'], gpu=False)
    print("Modelo EasyOCR cargado exitosamente.")
except Exception as e:
    print(f"Error fatal cargando EasyOCR: {e}")
    reader = None

def limpiar_texto_placa(texto_sucio: str) -> str | None:
    """
    Limpia el texto detectado por OCR para que parezca una placa.
    Ejemplo: "ABC. 123" -> "ABC123"
    """
    # Convertir a mayúsculas y quitar caracteres comunes no deseados
    texto_limpio = texto_sucio.upper().replace(' ', '').replace('-', '').replace('.', '').replace(':', '')
    
    # Expresión regular para buscar patrones comunes (ej. 3 letras seguidas de 3 números)
    # o patrones de moto (3 letras, 2 números, 1 letra)
    match = re.search(r'([A-Z]{3}[0-9]{3})|([A-Z]{3}[0-9]{2}[A-Z])', texto_limpio)
    
    if match:
        return match.group(0) # Devuelve la coincidencia encontrada
    
    # Si no hay un match perfecto, devolvemos el alfanumérico más largo
    # que tenga al menos 5 caracteres
    texto_limpio_alfanumerico = re.sub(r'[^A-Z0-9]', '', texto_limpio)
    if len(texto_limpio_alfanumerico) >= 5:
        return texto_limpio_alfanumerico[:7] # Limitamos a 7 chars

    return None

def detectar_placa(base64_image_data: str) -> str | None:
    """
    Función principal. Recibe una imagen en base64 y devuelve el texto de la placa.
    (Esta es la función que importará tu `controller_accesos.py`)
    """
    if reader is None:
        print("Error: El lector EasyOCR no está inicializado.")
        return None

    try:
        # 1. Decodificar Base64
        # Quitamos el prefijo 'data:image/jpeg;base64,' si existe
        if ',' in base64_image_data:
            base64_image_data = base64_image_data.split(',')[1]
            
        img_data = base64.b64decode(base64_image_data)
        
        # 2. Convertir a formato OpenCV
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("No se pudo decodificar la imagen.")

        # 3. Pre-procesamiento (Opcional, pero recomendado)
        # Convertir a escala de grises para mejorar la detección
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # (Opcional) Aplicar un filtro para reducir ruido
        # gray = cv2.bilateralFilter(gray, 11, 17, 17)

        # 4. Usar EasyOCR para leer texto
        # `detail=0` solo devuelve el texto, no las coordenadas
        # `paragraph=False` trata cada línea de texto como un bloque separado
        print("Ejecutando EasyOCR (readtext)...")
        results = reader.readtext(gray, detail=0, paragraph=False)
        print(f"Resultados de OCR (brutos): {results}")

        if not results:
            print("OCR no detectó texto.")
            return None

        # 5. Limpiar y seleccionar el mejor resultado
        for texto in results:
            placa_limpia = limpiar_texto_placa(texto)
            if placa_limpia:
                print(f"Placa limpia encontrada: {placa_limpia}")
                return placa_limpia # Devolvemos la primera coincidencia válida

        print("Se detectó texto, pero ninguno parece una placa válida.")
        return None

    except Exception as e:
        print(f"Error durante el procesamiento OCR: {e}")
        import traceback
        traceback.print_exc()
        return None

# --- BLOQUE DE PRUEBA INDEPENDIENTE ---
# Esto solo se ejecuta cuando corres `python backend/ocr/detector.py`
# No se ejecutará cuando tu controlador importe el archivo.

if __name__ == "__main__":
    print("\n--- INICIANDO PRUEBA LOCAL DE OCR ---")
    
    # --- RUTA CORREGIDA ---
    # __file__ es 'backend/ocr/detector.py'
    # os.path.dirname(__file__) es 'backend/ocr'
    script_dir = os.path.dirname(__file__)
    
    # La imagen está AHORA en el MISMO directorio 'ocr' y es .png
    RUTA_IMAGEN_PRUEBA = os.path.join(script_dir, "img_placas/placa_prueba3.jpg")
    # --- FIN DE LA CORRECCIÓN ---

    if not os.path.exists(RUTA_IMAGEN_PRUEBA):
        print(f"Error: No se encuentra la imagen de prueba en {RUTA_IMAGEN_PRUEBA}")
    else:
        print(f"Cargando imagen de prueba: {RUTA_IMAGEN_PRUEBA}")
        
        try:
            # 1. Leer la imagen del disco
            with open(RUTA_IMAGEN_PRUEBA, "rb") as image_file:
                img_bytes = image_file.read()

            # 2. Convertirla a Base64 (simulando lo que hará el frontend)
            base64_string = base64.b64encode(img_bytes).decode('utf-8')
            print(f"Imagen convertida a Base64 (primeros 50 chars): {base64_string[:50]}...")
            
            # 3. Llamar a tu función
            placa_detectada = detectar_placa(base64_string)
            
            # 4. Mostrar resultado
            print("\n--- RESULTADO DE LA PRUEBA ---")
            if placa_detectada:
                print(f"✅ ¡ÉXITO! Placa detectada: {placa_detectada}")
            else:
                print("❌ FALLO. No se pudo detectar una placa válida.")
            print("------------------------------")

        except Exception as e:
            print(f"Error durante la prueba local: {e}")