FROM python:3.11-slim

# Create a non-root user
RUN groupadd -g 2000 appuser && \
    useradd -m -r -u 2000 -g appuser appuser

WORKDIR /app

# Install system dependencies
# Install system dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY ./app ./app
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

ENV PYTHONPATH=/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
