# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1 \
    PYTORCH_ENABLE_MPS_FALLBACK=1 \
    TORCH_DEVICE=cpu

# Set working directory
WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv - the fast Python package installer
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy pyproject.toml for dependency installation
COPY pyproject.toml .
COPY README.md .

# Install CPU-only PyTorch first from PyTorch's CPU wheel index
# This avoids downloading 11GB CUDA packages
RUN uv pip install --system \
    torch torchvision \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies from PyPI
# Using --index-strategy unsafe-best-match to check all indexes
RUN uv pip install --system . --index-strategy unsafe-best-match

# Copy application code
COPY . .

# Create a non-root user for security
RUN useradd -m -u 1000 raguser && \
    chown -R raguser:raguser /app

# Switch to non-root user
USER raguser

ARG OLLAMA_BASE_URL
ARG EMBEDDING_MODEL_NAME
ARG EMBEDDING_DIMENSION

ARG QDRANT_HOST
ARG QDRANT_PORT
ARG QDRANT_COLLECTION_NAME

ARG HOST
ARG PORT

ENV OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
ENV EMBEDDING_MODEL_NAME=${EMBEDDING_MODEL_NAME}
ENV EMBEDDING_DIMENSION=${EMBEDDING_DIMENSION}

ENV QDRANT_HOST=${QDRANT_HOST}
ENV QDRANT_PORT=${QDRANT_PORT}
ENV QDRANT_COLLECTION_NAME=${QDRANT_COLLECTION_NAME}

ENV HOST=${HOST}
ENV PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Health check - checks service health after startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application with startup checks
CMD ["python", "startup.py"]
