#backend/faktur/utils/helpers.py

import re
from PIL import Image

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}

def clean_number(text):
    """Convert string seperti 'Rp 1.000.000,00' ke float 1000000.0"""
    if not text:
        return 0.0
    cleaned_text = re.sub(r"[^\d,.-]", "", text).strip()
    try:
        if "," in cleaned_text and "." in cleaned_text:
            cleaned_text = cleaned_text.replace(".", "").replace(",", ".")
        elif "." in cleaned_text and "," not in cleaned_text:
            cleaned_text = cleaned_text.replace(".", "")
        return float(cleaned_text)
    except ValueError:
        return 0.0

def format_currency(value, with_symbol=True):
    try:
        value = float(value)
        formatted = f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        return f"Rp {formatted}" if with_symbol else formatted
    except:
        return "Rp 0,00" if with_symbol else "0,00"

def clean_string(text):
    if not text:
        return ""
    if ":" in text:
        text = text.split(":", 1)[1]
    text = text.upper()
    text = re.sub(r"[^A-Z\s]", "", text)
    text = re.sub(r"\b(PT|CV|TBK|PERSERO|PERUM|UD)\b", "", text)
    words = [w for w in text.split() if len(w) > 2]
    return " ".join(words).strip()

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def is_image_file(filename):
    return filename.lower().endswith((".jpg", ".jpeg", ".png"))

def is_valid_image(path):
    try:
        with Image.open(path) as img:
            img.verify()
        return True
    except Exception:
        return False
