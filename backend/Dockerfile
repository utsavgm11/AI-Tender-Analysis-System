FROM python:3.10-slim

# 1. Install standard C++ compilers and core media rendering packages for Docling 
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy requirements first (better caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- PRODUCTION CRITICAL: PRE-DOWNLOAD MODEL WEIGHTS ---
# Docling automatically pulls neural model weights down on its first instantiation.
# Running this dry-run right now bakes the models directly into your Docker image. 
# This stops Render from timing out or lagging on your very first user document upload!
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()"

# 3. Copy everything
COPY . .

# 4. Set the PYTHONPATH so Python can find your modules
ENV PYTHONPATH=/app/backend
ENV PORT=10000

# 5. Move into the backend folder
WORKDIR /app/backend

# 6. Start with a very detailed command to catch errors
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000", "--log-level", "debug"]