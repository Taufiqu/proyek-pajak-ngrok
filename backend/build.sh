#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

apt-get update
apt-get install -y tesseract-ocr tesseract-ocr-ind poppler-utils