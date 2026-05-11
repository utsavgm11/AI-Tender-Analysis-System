#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Install Tesseract OCR
# This command works on Render's native Linux environment
apt-get update && apt-get install -y tesseract-ocr