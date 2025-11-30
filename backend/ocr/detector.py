import cv2
import numpy as np
import base64
import os
import re
import pytesseract

def limpiar_texto_placa(texto_sucio: str) -> str | None:
    texto_limpio = texto_sucio.upper().replace(' ', '').replace('-', '').replace('.', '').replace(':', '')
    match = re.search(r'([A-Z]{3}[0-9]{3})|([A-Z]{3}[0-9]{2}[A-Z])', texto_limpio)

    if match:
        return match.group(0)

    texto_limpio_alfanumerico = re.sub(r'[^A-Z0-9]', '', texto_limpio)
    if len(texto_limpio_alfanumerico) >= 5:
        return texto_limpio_alfanumerico[:7]

    return None


def detectar_placa(base64_image_data: str) -> str | None:
    try:
        if ',' in base64_image_data:
            base64_image_data = base64_image_data.split(',')[1]

        img_data = base64.b64decode(base64_image_data)

        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("No se pudo decodificar la imagen.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        ocr_text = pytesseract.image_to_string(gray, config="--psm 7")
        if not ocr_text:
            return None

        for texto in ocr_text.splitlines():
            placa = limpiar_texto_placa(texto)
            if placa:
                return placa

        return None

    except Exception as e:
        print(f"Error en OCR: {e}")
        return None


if __name__ == "__main__":
    print("\n--- PRUEBA LOCAL DE OCR (TESSERACT) ---")

    script_dir = os.path.dirname(__file__)
    ruta = os.path.join(script_dir, "img_placas/placa_prueba3.jpg")

    if not os.path.exists(ruta):
        print("No existe:", ruta)
    else:
        with open(ruta, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        print("Resultado:", detectar_placa(b64))
