# Use the official Manim Community Docker image as base
FROM manimcommunity/manim:latest

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Switch to root to install additional dependencies
USER root

# Install curl for health checks and create directories
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/temp /app/output /app/src

# Set working directory
WORKDIR /app

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy requirements file and install Python dependencies
COPY pyproject.toml .

# Install dependencies
RUN uv pip install --system -e .

# Copy application code
COPY src/ ./src/

# Create a non-root user if it doesn't exist
RUN id -u manimuser >/dev/null 2>&1 || (groupadd -r manimuser && useradd -r -s /bin/bash -g manimuser manimuser) \
    && chown -R manimuser:manimuser /app

# Switch to non-root user
USER manimuser

# Set build args and env vars
ARG REDIS_URL \
    JOB_STATUS_TTL_SECONDS \
    PORT

ENV REDIS_URL=${REDIS_URL} \
    JOB_STATUS_TTL_SECONDS=${JOB_STATUS_TTL_SECONDS} \
    PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run the application
CMD ["python", "src/app.py"]