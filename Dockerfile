# Multi-stage build for React + Python server

# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Python server
FROM python:3.11-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files
COPY pyproject.toml .

# Install Python dependencies using uv
RUN uv pip install --system -r pyproject.toml

# Copy the built React app from builder stage
COPY --from=builder /app/dist ./dist

# Copy Python server
COPY server.py .

# Expose port
EXPOSE 8000

# Run the Python server
CMD ["python", "server.py"]
