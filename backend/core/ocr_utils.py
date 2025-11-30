import pytesseract
from PIL import Image
import os

# ===========================================================
#  OCR CON TESSERACT – SmartCar
# ===========================================================

def leer_placa_imagen(ruta_imagen: str) -> str:
    """
    Lee una placa desde una imagen usando Tesseract OCR.

    Parámetro:
        ruta_imagen (str): ruta absoluta del archivo de imagen.

    Retorna:
        (str): texto detectado (placa), limpio y en mayúsculas.
    """

    if not os.path.exists(ruta_imagen):
        return ""

    try:
        # Abrir imagen
        imagen = Image.open(ruta_imagen)

        # Procesar con Tesseract
        texto = pytesseract.image_to_string(
            imagen,
            config="--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        )

        # Limpiar la salida
        placa = (
            texto.replace(" ", "")
                 .replace("\n", "")
                 .replace("\t", "")
                 .strip()
                 .upper()
        )

        # Mantener solo letras y números
        placa = "".join(c for c in placa if c.isalnum())

        return placa

    except Exception as e:
        print("❌ Error en OCR:", e)
        return ""
