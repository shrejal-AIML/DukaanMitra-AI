import cv2
import pytesseract
import re


def read_expiry_date(image_path):

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Image could not be read.")

    text = pytesseract.image_to_string(image)

    print("OCR TEXT:")
    print(text)

    expiry_pattern = (
        r'(?:EXP|EXPIRY|EXPIRY DATE)'
        r'\s*[:\-]?\s*'
        r'(\d{2}[/-]\d{2}[/-]\d{4})'
    )

    match = re.search(
        expiry_pattern,
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(1)

    return None