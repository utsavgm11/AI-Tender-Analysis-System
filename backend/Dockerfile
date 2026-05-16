FROM python:3.10-slim

# 1. Install system-level binaries required for Pytesseract and Pdf2image
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    poppler-utils \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy requirements first (better caching layer)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy everything else
COPY . .

# 4. Set the PYTHONPATH so Python can find your modules seamlessly
ENV PYTHONPATH=/app/backend
ENV PORT=10000

# 5. Move into the backend folder where main.py resides
WORKDIR /app/backend

# 6. Start the API app with detailed debugging flags to catch Render network errors
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000", "--log-level", "debug"]