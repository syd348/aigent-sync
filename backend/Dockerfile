# Use official Python lightweight image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Set work directory inside the container
WORKDIR /app

# Install system dependencies (build-essential and libpq-dev are useful for PostgreSQL drivers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app/

# Expose container port
EXPOSE 8080

# Run the app. Cloud Run dynamically injects the PORT env var, so we use a shell command to resolve it.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
