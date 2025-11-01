FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml ./

# Copy application code (needed for package installation)
COPY api/ ./api/
COPY sql/ ./sql/
COPY run.py ./

# Install Python dependencies using uv
RUN uv pip install --system .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

ARG PORT
ARG FRONTEND_URL


ENV PORT=${PORT}
ENV FRONTEND_URL=${FRONTEND_URL}

# Expose port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Run the application
CMD ["python", "run.py"]

