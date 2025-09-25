# Use the official Manim Community Docker image as base
FROM manimcommunity/manim:latest

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Switch to root to install additional dependencies
USER root

# Install curl for health checks and any additional system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file and install additional Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/temp /app/output /app/src

# Copy application code
COPY src/ ./src/

# Create a non-root user (manimuser) if it doesn't exist, or use existing manimuser from base image
RUN id -u manimuser >/dev/null 2>&1 || (groupadd -r manimuser && useradd -r -s /bin/bash -g manimuser manimuser)

# Change ownership of app directory to manimuser
RUN chown -R manimuser:manimuser /app

# Switch to non-root user
USER manimuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "src/app.py"]